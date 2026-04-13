// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { getUserAffinityRanking, sortPostsByAffinity } from "@/lib/smart-feed"; // ✨

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

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
    const page       = parseInt(searchParams.get("page")  || "1");
    const limit      = parseInt(searchParams.get("limit") || "5");
    const visibility = searchParams.get("visibility") || "all";
    const smart      = searchParams.get("smart") === "true"; // ✨ nouveau param

    const skip = (page - 1) * limit;

    // ── Construction du whereClause (identique à l'original) ────────────
    const whereClause: any = {};

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { initiatorId: user.id, status: "accepted" },
          { receiverId: user.id,  status: "accepted" },
        ],
      },
      select: { initiatorId: true, receiverId: true },
    });

    const friendIds = friendships.map((f) =>
      f.initiatorId === user.id ? f.receiverId : f.initiatorId
    );

    if (visibility !== "all") {
      if (visibility === "friends") {
        whereClause.OR = [
          { authorId: user.id,               visibility: "friends" },
          { authorId: { in: friendIds },     visibility: "friends" },
        ];
      } else {
        whereClause.visibility = visibility;
      }
    } else {
      whereClause.OR = [
        { authorId: user.id },
        { visibility: "public" },
        { authorId: { in: friendIds }, visibility: "friends" },
      ];
    }

    // ── Récupération des posts ───────────────────────────────────────────
    // En mode smart : on charge plus de posts pour avoir de quoi trier
    // En mode normal : comportement identique à l'original
    const fetchLimit = smart ? Math.min(limit * 4, 40) : limit;
    const fetchSkip  = smart ? 0 : skip;

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            profil: {
              select: { pseudo: true, profilePhotoUrl: true },
            },
          },
        },
        media:    { orderBy: { order: "asc" } },
        reactions: {
          include: {
            type: true,
            user: { select: { id: true, nom: true, prenom: true } },
          },
        },
        comments: {
          where:   { parentId: null },
          include: {
            author: {
              select: {
                id: true, nom: true, prenom: true,
                profil: { select: { pseudo: true, profilePhotoUrl: true } },
              },
            },
            reactions: { include: { type: true } },
            replies:   { select: { id: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        _count: { select: { reactions: true, comments: true } },
        // ✨ On inclut la catégorie pour le tri par affinité
        category: { select: { code: true, label: true, emoji: true } },
      },
      orderBy: { createdAt: "desc" },
      skip:    fetchSkip,
      take:    fetchLimit,
    });

    const total = await prisma.post.count({ where: whereClause });

    // ── Enrichissement (identique à l'original) ──────────────────────────
    const enrichedPosts = posts.map((post) => {
      const userReaction = post.reactions.find((r) => r.userId === user.id);
      return {
        ...post,
        // ✨ Exposer le code catégorie pour le tri et le tracking front
        categoryCode: post.category?.code ?? null,
        userReaction: userReaction
          ? { id: userReaction.id, type: userReaction.type }
          : null,
        reactionCounts: post.reactions.reduce((acc, r) => {
          acc[r.type.code] = (acc[r.type.code] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    });

    // ── Tri intelligent par affinité ✨ ──────────────────────────────────
    let finalPosts = enrichedPosts;

    if (smart) {
      const affinityRanking = await getUserAffinityRanking(user.id);

      if (affinityRanking.length > 0) {
        // Trier par affinité puis paginer manuellement
        const sorted = sortPostsByAffinity(enrichedPosts, affinityRanking);
        finalPosts = sorted.slice(skip, skip + limit);
      } else {
        // Pas encore d'affinités → comportement normal
        finalPosts = enrichedPosts.slice(0, limit);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        posts: finalPosts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + finalPosts.length < total,
        },
        // ✨ Indique au frontend si le tri intelligent est actif
        smartFeed: smart,
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