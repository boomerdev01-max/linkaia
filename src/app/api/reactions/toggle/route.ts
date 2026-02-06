// app/api/reactions/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/reactions/toggle
 * Ajoute ou retire une réaction sur un post ou commentaire
 *
 * Body:
 * - targetType: "post" | "comment"
 * - targetId: string (ID du post ou commentaire)
 * - reactionCode: "support" | "love" | "laugh" | "wow" | "sad" | "angry"
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { targetType, targetId, reactionCode } = body;

    if (!targetType || !targetId || !reactionCode) {
      return NextResponse.json(
        {
          success: false,
          error: "targetType, targetId et reactionCode requis",
        },
        { status: 400 }
      );
    }

    // Récupérer le type de réaction
    const reactionType = await prisma.reactionType.findUnique({
      where: { code: reactionCode },
    });

    if (!reactionType) {
      return NextResponse.json(
        { success: false, error: "Type de réaction invalide" },
        { status: 400 }
      );
    }

    // Vérifier que la cible existe
    if (targetType === "post") {
      const post = await prisma.post.findUnique({
        where: { id: targetId },
        include: {
          author: {
            select: {
              id: true,
              nom: true,
              prenom: true,
            },
          },
        },
      });

      if (!post) {
        return NextResponse.json(
          { success: false, error: "Post non trouvé" },
          { status: 404 }
        );
      }

      // Vérifier si l'utilisateur a déjà réagi
      const existingReaction = await prisma.reaction.findFirst({
        where: {
          userId: user.id,
          postId: targetId,
        },
      });

      if (existingReaction) {
        // Si même type de réaction, on la supprime (toggle off)
        if (existingReaction.typeId === reactionType.id) {
          await prisma.reaction.delete({
            where: { id: existingReaction.id },
          });

          return NextResponse.json({
            success: true,
            message: "Réaction retirée",
            action: "removed",
          });
        } else {
          // Sinon, on met à jour avec le nouveau type
          const updatedReaction = await prisma.reaction.update({
            where: { id: existingReaction.id },
            data: { typeId: reactionType.id },
            include: { type: true },
          });

          return NextResponse.json({
            success: true,
            message: "Réaction modifiée",
            action: "updated",
            data: updatedReaction,
          });
        }
      } else {
        // Créer la nouvelle réaction
        const newReaction = await prisma.reaction.create({
          data: {
            userId: user.id,
            postId: targetId,
            typeId: reactionType.id,
          },
          include: { type: true },
        });

        // Créer une notification pour l'auteur du post
        if (post.authorId !== user.id) {
          await prisma.notification.create({
            data: {
              userId: post.authorId,
              type: "post_reaction",
              title: "Nouvelle réaction",
              message: `${user.prenom} ${user.nom} a réagi ${reactionType.emoji} à votre publication`,
              metadata: JSON.stringify({
                postId: targetId,
                reactionCode: reactionType.code,
                actorId: user.id,
              }),
            },
          });
        }

        return NextResponse.json({
          success: true,
          message: "Réaction ajoutée",
          action: "added",
          data: newReaction,
        });
      }
    } else if (targetType === "comment") {
      const comment = await prisma.comment.findUnique({
        where: { id: targetId },
        include: {
          author: {
            select: {
              id: true,
              nom: true,
              prenom: true,
            },
          },
        },
      });

      if (!comment) {
        return NextResponse.json(
          { success: false, error: "Commentaire non trouvé" },
          { status: 404 }
        );
      }

      // Vérifier si l'utilisateur a déjà réagi
      const existingReaction = await prisma.reaction.findFirst({
        where: {
          userId: user.id,
          commentId: targetId,
        },
      });

      if (existingReaction) {
        // Si même type de réaction, on la supprime (toggle off)
        if (existingReaction.typeId === reactionType.id) {
          await prisma.reaction.delete({
            where: { id: existingReaction.id },
          });

          return NextResponse.json({
            success: true,
            message: "Réaction retirée",
            action: "removed",
          });
        } else {
          // Sinon, on met à jour avec le nouveau type
          const updatedReaction = await prisma.reaction.update({
            where: { id: existingReaction.id },
            data: { typeId: reactionType.id },
            include: { type: true },
          });

          return NextResponse.json({
            success: true,
            message: "Réaction modifiée",
            action: "updated",
            data: updatedReaction,
          });
        }
      } else {
        // Créer la nouvelle réaction
        const newReaction = await prisma.reaction.create({
          data: {
            userId: user.id,
            commentId: targetId,
            typeId: reactionType.id,
          },
          include: { type: true },
        });

        // Créer une notification pour l'auteur du commentaire
        if (comment.authorId !== user.id) {
          await prisma.notification.create({
            data: {
              userId: comment.authorId,
              type: "comment_reaction",
              title: "Nouvelle réaction",
              message: `${user.prenom} ${user.nom} a réagi ${reactionType.emoji} à votre commentaire`,
              metadata: JSON.stringify({
                commentId: targetId,
                postId: comment.postId,
                reactionCode: reactionType.code,
                actorId: user.id,
              }),
            },
          });
        }

        return NextResponse.json({
          success: true,
          message: "Réaction ajoutée",
          action: "added",
          data: newReaction,
        });
      }
    } else {
      return NextResponse.json(
        { success: false, error: "targetType invalide" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ Error toggling reaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle reaction" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reactions/types
 * Récupère tous les types de réactions disponibles
 */
export async function GET() {
  try {
    const reactionTypes = await prisma.reactionType.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: reactionTypes,
    });
  } catch (error) {
    console.error("❌ Error fetching reaction types:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reaction types" },
      { status: 500 }
    );
  }
}
