// src/app/api/my-stats/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

/**
 * GET /api/my-stats/posts
 * Retourne les statistiques détaillées par post de l'utilisateur connecté.
 *
 * Query params :
 *   period = "7d" | "30d" | "all" | "custom"
 *   from   = ISO date (si period=custom)
 *   to     = ISO date (si period=custom)
 *   page   = numéro de page (défaut: 1)
 *   limit  = nombre de posts par page (défaut: 10)
 *   sort   = "views" | "reactions" | "comments" | "date" (défaut: "views")
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "7d";
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)),
    );
    const sort = searchParams.get("sort") ?? "views";

    // ── Plage de dates ───────────────────────────────────────────────────────
    const now = new Date();
    let dateFrom: Date | null = null;
    let dateTo: Date = now;

    if (period === "7d") {
      dateFrom = new Date(now);
      dateFrom.setDate(dateFrom.getDate() - 7);
    } else if (period === "30d") {
      dateFrom = new Date(now);
      dateFrom.setDate(dateFrom.getDate() - 30);
    } else if (period === "custom" && fromParam && toParam) {
      dateFrom = new Date(fromParam);
      dateTo = new Date(toParam);
    }

    const dateFilter = dateFrom ? { gte: dateFrom, lte: dateTo } : undefined;

    // ── Récupérer tous les posts de l'utilisateur avec stats ─────────────────
    const posts = await prisma.post.findMany({
      where: { authorId: user.id },
      select: {
        id: true,
        content: true,
        createdAt: true,
        editedAt: true,
        media: {
          select: { type: true, url: true, order: true },
          orderBy: { order: "asc" },
          take: 1, // Juste la première média pour l'aperçu
        },
        views: {
          where: dateFilter ? { createdAt: dateFilter } : {},
          select: { id: true },
        },
        reactions: {
          where: {
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
          select: {
            id: true,
            type: {
              select: { code: true, emoji: true, label: true },
            },
          },
        },
        comments: {
          where: {
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Calculer les métriques par post ──────────────────────────────────────
    const postsWithStats = posts.map((post) => {
      const viewsCount = post.views.length;
      const reactionsCount = post.reactions.length;
      const commentsCount = post.comments.length;

      // Répartition réactions par type
      const reactionsByType: Record<
        string,
        { code: string; emoji: string; label: string; count: number }
      > = {};
      for (const reaction of post.reactions) {
        const { code, emoji, label } = reaction.type;
        if (!reactionsByType[code]) {
          reactionsByType[code] = { code, emoji, label, count: 0 };
        }
        reactionsByType[code].count++;
      }

      // Aperçu du contenu (tronqué à 120 caractères)
      const contentPreview = post.content
        ? post.content.length > 120
          ? post.content.substring(0, 120) + "..."
          : post.content
        : null;

      return {
        id: post.id,
        contentPreview,
        createdAt: post.createdAt.toISOString(),
        mediaPreview: post.media[0] ?? null,
        stats: {
          views: viewsCount,
          reactions: reactionsCount,
          comments: commentsCount,
          engagementRate:
            viewsCount > 0
              ? Math.round(
                  ((reactionsCount + commentsCount) / viewsCount) * 100,
                )
              : 0,
        },
        reactionsByType: Object.values(reactionsByType),
      };
    });

    // ── Tri ──────────────────────────────────────────────────────────────────
    const sorted = [...postsWithStats].sort((a, b) => {
      switch (sort) {
        case "reactions":
          return b.stats.reactions - a.stats.reactions;
        case "comments":
          return b.stats.comments - a.stats.comments;
        case "date":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "views":
        default:
          return b.stats.views - a.stats.views;
      }
    });

    // ── Pagination ───────────────────────────────────────────────────────────
    const total = sorted.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginated = sorted.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        posts: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
        sort,
        period,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/my-stats/posts:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
