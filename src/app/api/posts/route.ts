// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/posts
 * Récupère les posts avec pagination
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 5)
 * - visibility: "public" | "friends" | "private" | "all" (default: "all")
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

    // Récupérer l'utilisateur depuis Prisma
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const visibility = searchParams.get("visibility") || "all";

    const skip = (page - 1) * limit;

    // Construire le where clause basé sur la visibilité
    const whereClause: any = {};

    if (visibility !== "all") {
      if (visibility === "friends") {
        // Récupérer les IDs des amis
        const friendships = await prisma.friendship.findMany({
          where: {
            OR: [
              { initiatorId: user.id, status: "accepted" },
              { receiverId: user.id, status: "accepted" },
            ],
          },
          select: {
            initiatorId: true,
            receiverId: true,
          },
        });

        const friendIds = friendships.map((f) =>
          f.initiatorId === user.id ? f.receiverId : f.initiatorId
        );

        whereClause.OR = [
          { authorId: user.id, visibility: "friends" },
          { authorId: { in: friendIds }, visibility: "friends" },
        ];
      } else {
        whereClause.visibility = visibility;
      }
    } else {
      // Afficher: mes posts (tous) + posts publics + posts d'amis
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { initiatorId: user.id, status: "accepted" },
            { receiverId: user.id, status: "accepted" },
          ],
        },
        select: {
          initiatorId: true,
          receiverId: true,
        },
      });

      const friendIds = friendships.map((f) =>
        f.initiatorId === user.id ? f.receiverId : f.initiatorId
      );

      whereClause.OR = [
        { authorId: user.id }, // Mes posts (toutes visibilités)
        { visibility: "public" }, // Posts publics
        { authorId: { in: friendIds }, visibility: "friends" }, // Posts d'amis
      ];
    }

    // Récupérer les posts
    const posts = await prisma.post.findMany({
      where: whereClause,
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
        media: {
          orderBy: { order: "asc" },
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
        comments: {
          where: { parentId: null }, // Only top-level comments
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
              },
            },
            replies: {
              select: {
                id: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 3, // Afficher seulement 3 commentaires par défaut
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Compter le total pour la pagination
    const total = await prisma.post.count({ where: whereClause });

    // Enrichir les posts avec les infos de réaction de l'utilisateur actuel
    const enrichedPosts = posts.map((post) => {
      const userReaction = post.reactions.find((r) => r.userId === user.id);

      return {
        ...post,
        userReaction: userReaction
          ? {
              id: userReaction.id,
              type: userReaction.type,
            }
          : null,
        reactionCounts: post.reactions.reduce((acc, r) => {
          acc[r.type.code] = (acc[r.type.code] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        posts: enrichedPosts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + posts.length < total,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching posts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
