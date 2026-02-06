// app/api/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/comments?postId=xxx&parentId=xxx
 * Récupère les commentaires d'un post ou les réponses d'un commentaire
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const parentId = searchParams.get("parentId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "3");

    if (!postId) {
      return NextResponse.json(
        { success: false, error: "postId requis" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: parentId || null,
      },
      include: {
        author: {
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
        reactions: {
          include: {
            type: true,
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        replies: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.comment.count({
      where: {
        postId,
        parentId: parentId || null,
      },
    });

    // Enrichir avec la réaction de l'utilisateur
    const enrichedComments = comments.map((comment) => {
      const userReaction = comment.reactions.find((r) => r.userId === user.id);

      return {
        ...comment,
        userReaction: userReaction
          ? {
              id: userReaction.id,
              type: userReaction.type,
            }
          : null,
        reactionCounts: comment.reactions.reduce((acc, r) => {
          acc[r.type.code] = (acc[r.type.code] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        comments: enrichedComments,
        pagination: {
          page,
          limit,
          total,
          hasMore: skip + comments.length < total,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching comments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments
 * Crée un nouveau commentaire ou une réponse
 * 
 * Body:
 * - postId: string (requis)
 * - content: string (requis)
 * - parentId: string (optionnel, pour les réponses)
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
    const { postId, content, parentId } = body;

    if (!postId || !content) {
      return NextResponse.json(
        { success: false, error: "postId et content requis" },
        { status: 400 }
      );
    }

    // Vérifier que le post existe
    const post = await prisma.post.findUnique({
      where: { id: postId },
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

    // Si parentId fourni, vérifier que le commentaire parent existe
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
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

      if (!parentComment) {
        return NextResponse.json(
          { success: false, error: "Commentaire parent non trouvé" },
          { status: 404 }
        );
      }

      // Créer une notification pour le commentaire parent
      if (parentComment.authorId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: parentComment.authorId,
            type: "comment_reply",
            title: "Nouvelle réponse à votre commentaire",
            message: `${user.prenom} ${user.nom} a répondu à votre commentaire`,
            metadata: JSON.stringify({
              postId,
              commentId: parentId,
              actorId: user.id,
            }),
          },
        });
      }
    } else {
      // Créer une notification pour l'auteur du post
      if (post.authorId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: "post_comment",
            title: "Nouveau commentaire",
            message: `${user.prenom} ${user.nom} a commenté votre publication`,
            metadata: JSON.stringify({
              postId,
              actorId: user.id,
            }),
          },
        });
      }
    }

    // Créer le commentaire
    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: user.id,
        parentId: parentId || null,
      },
      include: {
        author: {
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
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Commentaire créé avec succès",
      data: comment,
    });
  } catch (error) {
    console.error("❌ Error creating comment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
}