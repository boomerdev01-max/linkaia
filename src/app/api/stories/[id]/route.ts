// src/app/api/stories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { deleteAllStoryMedia } from "@/lib/story-storage";

// ============================================
// GET /api/stories/[id] - Détails d'une story
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    const { id } = await params;

    const story = await prisma.story.findUnique({
      where: { id },
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
          include: {
            viewer: {
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
          orderBy: { viewedAt: "desc" },
        },
        reactions: {
          include: {
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
        },
        _count: {
          select: {
            views: true,
            reactions: true,
          },
        },
      },
    });

    if (!story) {
      return NextResponse.json(
        { success: false, error: "Story non trouvée" },
        { status: 404 },
      );
    }

    // Vérifier si expirée
    if (story.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "Story expirée" },
        { status: 410 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { story },
    });
  } catch (error) {
    console.error("❌ Error fetching story:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération" },
      { status: 500 },
    );
  }
}

// ============================================
// DELETE /api/stories/[id] - Supprimer sa story
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    const { id } = await params;

    // Vérifier que la story appartient à l'utilisateur
    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        slides: {
          select: { mediaUrl: true },
        },
      },
    });

    if (!story) {
      return NextResponse.json(
        { success: false, error: "Story non trouvée" },
        { status: 404 },
      );
    }

    if (story.userId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Action non autorisée" },
        { status: 403 },
      );
    }

    // Supprimer les médias du storage
    await deleteAllStoryMedia(story.id, story.userId);

    // Supprimer la story de la DB (cascade supprimera slides, views, reactions)
    await prisma.story.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Story supprimée avec succès",
    });
  } catch (error) {
    console.error("❌ Error deleting story:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression" },
      { status: 500 },
    );
  }
}
