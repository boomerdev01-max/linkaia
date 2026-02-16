// src/app/api/stories/[id]/view/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    const { id: storyId } = await params;

    // Vérifier que la story existe et n'est pas expirée
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!story) {
      return NextResponse.json(
        { success: false, error: "Story non trouvée" },
        { status: 404 },
      );
    }

    if (story.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "Story expirée" },
        { status: 410 },
      );
    }

    // Ne pas enregistrer la vue si c'est sa propre story
    if (story.userId === auth.user.id) {
      return NextResponse.json({
        success: true,
        message: "Vue non enregistrée (propre story)",
      });
    }

    // Créer ou récupérer la vue (upsert)
    await prisma.storyView.upsert({
      where: {
        storyId_viewerId: {
          storyId,
          viewerId: auth.user.id,
        },
      },
      update: {
        viewedAt: new Date(), // Mettre à jour la date si déjà vue
      },
      create: {
        storyId,
        viewerId: auth.user.id,
      },
    });

    // Mettre à jour le compteur de vues
    await prisma.story.update({
      where: { id: storyId },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Vue enregistrée",
    });
  } catch (error) {
    console.error("❌ Error recording story view:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'enregistrement de la vue" },
      { status: 500 },
    );
  }
}
