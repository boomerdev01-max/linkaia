// src/app/api/reactions/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/behavioral-tracking"; // ✨

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non trouvé" },
        { status: 404 },
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
        { status: 400 },
      );
    }

    const reactionType = await prisma.reactionType.findUnique({
      where: { code: reactionCode },
    });

    if (!reactionType) {
      return NextResponse.json(
        { success: false, error: "Type de réaction invalide" },
        { status: 400 },
      );
    }

    if (targetType === "post") {
      const post = await prisma.post.findUnique({
        where: { id: targetId },
        include: { author: { select: { id: true, nom: true, prenom: true } } },
      });

      if (!post) {
        return NextResponse.json(
          { success: false, error: "Post non trouvé" },
          { status: 404 },
        );
      }

      const existingReaction = await prisma.reaction.findFirst({
        where: { userId: user.id, postId: targetId },
      });

      if (existingReaction) {
        if (existingReaction.typeId === reactionType.id) {
          await prisma.reaction.delete({ where: { id: existingReaction.id } });
          return NextResponse.json({
            success: true,
            message: "Réaction retirée",
            action: "removed",
          });
        } else {
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
        const newReaction = await prisma.reaction.create({
          data: { userId: user.id, postId: targetId, typeId: reactionType.id },
          include: { type: true },
        });

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

        // ✨ Tracking — seulement sur "added", signal fort
        trackEvent({
          userId: user.id,
          eventType: "post_reaction",
          targetId,
          targetType: "post",
          postId: targetId,
        });

        return NextResponse.json({
          success: true,
          message: "Réaction ajoutée",
          action: "added",
          data: newReaction,
        });
      }
    } else if (targetType === "comment") {
      // ── Bloc commentaire : identique à l'original, aucun tracking
      //    (les réactions sur commentaires ne reflètent pas d'affinité catégorielle)
      const comment = await prisma.comment.findUnique({
        where: { id: targetId },
        include: { author: { select: { id: true, nom: true, prenom: true } } },
      });

      if (!comment) {
        return NextResponse.json(
          { success: false, error: "Commentaire non trouvé" },
          { status: 404 },
        );
      }

      const existingReaction = await prisma.reaction.findFirst({
        where: { userId: user.id, commentId: targetId },
      });

      if (existingReaction) {
        if (existingReaction.typeId === reactionType.id) {
          await prisma.reaction.delete({ where: { id: existingReaction.id } });
          return NextResponse.json({
            success: true,
            message: "Réaction retirée",
            action: "removed",
          });
        } else {
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
        const newReaction = await prisma.reaction.create({
          data: {
            userId: user.id,
            commentId: targetId,
            typeId: reactionType.id,
          },
          include: { type: true },
        });

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
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("❌ Error toggling reaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle reaction" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const reactionTypes = await prisma.reactionType.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ success: true, data: reactionTypes });
  } catch (error) {
    console.error("❌ Error fetching reaction types:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reaction types" },
      { status: 500 },
    );
  }
}
