// src/app/api/profile/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { trackProfileVisit } from "@/lib/notification-helpers";

/**
 * GET /api/profile/[id]
 * Récupère un profil complet par son ID
 * ✨ Track automatiquement la visite de profil
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Vérifier l'authentification
    const auth = await requireAuth();
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    const { id: profileUserId } = await params;

    // 2. Récupérer le profil complet
    const profile = await prisma.user.findUnique({
      where: { id: profileUserId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        level: true,
        profil: {
          include: {
            nationalites: {
              include: {
                nationality: true,
              },
            },
            interests: {
              include: {
                interest: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            posts: true,
            profileLikesReceived: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profil non trouvé" },
        { status: 404 }
      );
    }

    // 3. ✨ Tracker la visite de profil (uniquement la première fois)
    // Exécuter en arrière-plan sans bloquer la réponse
    trackProfileVisit(auth.user.id, profileUserId).catch((err) => {
      console.error("❌ Error tracking profile visit:", err);
    });

    // 4. Retourner le profil
    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("❌ GET /api/profile/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}