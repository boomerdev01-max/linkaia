// src/app/api/stories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// ============================================
// POST /api/stories - Créer une story
// ============================================
export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    const auth = await requireAuth();
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    // 2. Récupérer les données
    const body = await request.json();
    const { slides } = body;

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { success: false, error: "Au moins un slide requis" },
        { status: 400 },
      );
    }

    // 3. Valider les slides
    for (const slide of slides) {
      if (!slide.type || !["PHOTO", "VIDEO", "TEXT"].includes(slide.type)) {
        return NextResponse.json(
          { success: false, error: "Type de slide invalide" },
          { status: 400 },
        );
      }

      if (slide.type === "TEXT" && !slide.textContent) {
        return NextResponse.json(
          { success: false, error: "Texte requis pour slide TEXT" },
          { status: 400 },
        );
      }

      if (
        (slide.type === "PHOTO" || slide.type === "VIDEO") &&
        !slide.mediaUrl
      ) {
        return NextResponse.json(
          { success: false, error: "URL média requise pour PHOTO/VIDEO" },
          { status: 400 },
        );
      }
    }

    // 4. Calculer la date d'expiration (24h)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 5. Créer la story avec ses slides
    const story = await prisma.story.create({
      data: {
        userId: auth.user.id,
        expiresAt,
        slides: {
          create: slides.map((slide: any, index: number) => ({
            order: index,
            type: slide.type,
            // PHOTO/VIDEO
            mediaUrl: slide.mediaUrl || null,
            thumbnailUrl: slide.thumbnailUrl || null,
            mimeType: slide.mimeType || null,
            width: slide.width || null,
            height: slide.height || null,
            duration: slide.duration || null,
            // TEXT
            textContent: slide.textContent || null,
            bgColor: slide.bgColor || null,
            textColor: slide.textColor || "#FFFFFF",
            fontSize: slide.fontSize || "medium",
          })),
        },
      },
      include: {
        slides: {
          orderBy: { order: "asc" },
        },
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            profil: {
              select: {
                pseudo: true,
                profilePhotoUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { story },
    });
  } catch (error) {
    console.error("❌ Error creating story:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création de la story" },
      { status: 500 },
    );
  }
}

// ============================================
// GET /api/stories - Récupérer les stories actives
// ============================================
export async function GET(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    const auth = await requireAuth();
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    const now = new Date();

    // 2. Récupérer toutes les stories actives (non expirées)
    const stories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
        isExpired: false,
      },
      include: {
        slides: {
          orderBy: { order: "asc" },
        },
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            profil: {
              select: {
                pseudo: true,
                profilePhotoUrl: true,
              },
            },
          },
        },
        views: {
          where: { viewerId: auth.user.id },
          select: { id: true },
        },
        _count: {
          select: {
            views: true,
            reactions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. ✅ CORRECTION : inclure la propre story de l'utilisateur dans toutes les catégories
    //    - userStory  : la story de l'utilisateur courant (toujours en premier)
    //    - unviewed   : stories non vues DES AUTRES utilisateurs
    //    - viewed     : stories vues DES AUTRES utilisateurs
    const userStory = stories.find((s) => s.userId === auth.user!.id);
    const otherStories = stories.filter((s) => s.userId !== auth.user!.id);

    const viewed = otherStories.filter((s) => s.views.length > 0);
    const unviewed = otherStories.filter((s) => s.views.length === 0);

    // 4. Mélanger aléatoirement les non vues
    const shuffledUnviewed = unviewed.sort(() => Math.random() - 0.5);

    // 5. Construire le résultat : user story → non vues → vues
    const orderedStories = [
      ...(userStory ? [userStory] : []),
      ...shuffledUnviewed,
      ...viewed,
    ].map((story) => ({
      ...story,
      // ✅ hasViewed : pour sa propre story, on considère toujours comme "vu"
      //    Pour les autres, on vérifie les views
      hasViewed: story.userId === auth.user!.id ? true : story.views.length > 0,
      isOwn: story.userId === auth.user!.id,
    }));

    return NextResponse.json({
      success: true,
      data: { stories: orderedStories },
    });
  } catch (error) {
    console.error("❌ Error fetching stories:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des stories" },
      { status: 500 },
    );
  }
}
