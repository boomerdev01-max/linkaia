// src/app/api/stories/[id]/react/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const ALLOWED_EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

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
    const { emoji } = await request.json();

    // Valider l'emoji
    if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
      return NextResponse.json(
        { success: false, error: "Emoji non autorisé" },
        { status: 400 },
      );
    }

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

    // Vérifier si l'utilisateur a déjà réagi
    const existingReaction = await prisma.storyReaction.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId: auth.user.id,
        },
      },
    });

    if (existingReaction) {
      // Si même emoji → Supprimer la réaction (toggle)
      if (existingReaction.emoji === emoji) {
        await prisma.storyReaction.delete({
          where: { id: existingReaction.id },
        });

        await prisma.story.update({
          where: { id: storyId },
          data: {
            reactionsCount: {
              decrement: 1,
            },
          },
        });

        return NextResponse.json({
          success: true,
          action: "removed",
          message: "Réaction supprimée",
        });
      } else {
        // Sinon → Modifier l'emoji
        await prisma.storyReaction.update({
          where: { id: existingReaction.id },
          data: { emoji },
        });

        return NextResponse.json({
          success: true,
          action: "updated",
          message: "Réaction modifiée",
        });
      }
    } else {
      // Créer une nouvelle réaction
      await prisma.storyReaction.create({
        data: {
          storyId,
          userId: auth.user.id,
          emoji,
        },
      });

      await prisma.story.update({
        where: { id: storyId },
        data: {
          reactionsCount: {
            increment: 1,
          },
        },
      });

      return NextResponse.json({
        success: true,
        action: "added",
        message: "Réaction ajoutée",
      });
    }
  } catch (error) {
    console.error("❌ Error reacting to story:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la réaction" },
      { status: 500 },
    );
  }
}
