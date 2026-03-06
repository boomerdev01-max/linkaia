// src/app/api/my-stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

/**
 * GET /api/my-stats
 * Retourne les statistiques globales de l'utilisateur connecté.
 *
 * Query params :
 *   period = "7d" | "30d" | "all" | "custom"
 *   from   = ISO date (uniquement si period=custom)
 *   to     = ISO date (uniquement si period=custom)
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

    // ── Calcul de la plage de dates ──────────────────────────────────────────
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
    // period === "all" → dateFrom reste null (pas de filtre)

    const dateFilter = dateFrom
      ? { gte: dateFrom, lte: dateTo }
      : undefined;

    // ── Récupérer tous les posts de l'utilisateur ────────────────────────────
    const userPosts = await prisma.post.findMany({
      where: { authorId: user.id },
      select: { id: true },
    });
    const postIds = userPosts.map((p) => p.id);

    if (postIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: buildEmptyStats(),
      });
    }

    // ── Stats globales en parallèle ──────────────────────────────────────────
    const [
      totalViews,
      totalReactions,
      totalComments,
      reactionsByType,
      dailyViews,
      dailyReactions,
      dailyComments,
      totalPosts,
      totalStories,
    ] = await Promise.all([
      // Vues totales
      prisma.postView.count({
        where: {
          postId: { in: postIds },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),

      // Réactions totales
      prisma.reaction.count({
        where: {
          postId: { in: postIds },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),

      // Commentaires totaux
      prisma.comment.count({
        where: {
          postId: { in: postIds },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),

      // Répartition réactions par type
      prisma.reaction.groupBy({
        by: ["typeId"],
        where: {
          postId: { in: postIds },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _count: { typeId: true },
      }),

      // Évolution des vues jour par jour
      buildDailyTimeline(
        prisma,
        "postView",
        postIds,
        dateFrom,
        dateTo,
        "postId"
      ),

      // Évolution des réactions jour par jour
      buildDailyTimeline(
        prisma,
        "reaction",
        postIds,
        dateFrom,
        dateTo,
        "postId"
      ),

      // Évolution des commentaires jour par jour
      buildDailyTimeline(
        prisma,
        "comment",
        postIds,
        dateFrom,
        dateTo,
        "postId"
      ),

      // Total posts
      prisma.post.count({ where: { authorId: user.id } }),

      // Total stories
      prisma.story.count({ where: { userId: user.id } }),
    ]);

    // ── Récupérer les labels des types de réaction ───────────────────────────
    const reactionTypeIds = reactionsByType.map((r) => r.typeId);
    const reactionTypes = await prisma.reactionType.findMany({
      where: { id: { in: reactionTypeIds } },
      select: { id: true, code: true, label: true, emoji: true },
    });

    const reactionTypeMap = Object.fromEntries(
      reactionTypes.map((rt) => [rt.id, rt])
    );

    const reactionsDetail = reactionsByType.map((r) => ({
      code: reactionTypeMap[r.typeId]?.code ?? "unknown",
      label: reactionTypeMap[r.typeId]?.label ?? "Inconnu",
      emoji: reactionTypeMap[r.typeId]?.emoji ?? "❓",
      count: r._count.typeId,
    }));

    // ── Fusionner les timelines ──────────────────────────────────────────────
    const timeline = mergeDailyTimelines(
      dailyViews,
      dailyReactions,
      dailyComments
    );

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateFrom: dateFrom?.toISOString() ?? null,
        dateTo: dateTo.toISOString(),
        totals: {
          posts: totalPosts,
          stories: totalStories,
          views: totalViews,
          reactions: totalReactions,
          comments: totalComments,
        },
        reactionsDetail,
        timeline,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/my-stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildEmptyStats() {
  return {
    period: "7d",
    dateFrom: null,
    dateTo: new Date().toISOString(),
    totals: { posts: 0, stories: 0, views: 0, reactions: 0, comments: 0 },
    reactionsDetail: [],
    timeline: [],
  };
}

/**
 * Construit une série temporelle jour par jour depuis la DB.
 * On groupe par date (YYYY-MM-DD) côté JS après récupération.
 */
async function buildDailyTimeline(
  prisma: any,
  model: "postView" | "reaction" | "comment",
  postIds: string[],
  dateFrom: Date | null,
  dateTo: Date,
  postField: "postId"
): Promise<{ date: string; count: number }[]> {
  const where: any = {
    [postField]: { in: postIds },
  };
  if (dateFrom) {
    where.createdAt = { gte: dateFrom, lte: dateTo };
  }

  const records = await (prisma[model] as any).findMany({
    where,
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Grouper par date
  const map = new Map<string, number>();
  for (const r of records) {
    const dateKey = r.createdAt.toISOString().split("T")[0];
    map.set(dateKey, (map.get(dateKey) ?? 0) + 1);
  }

  // Remplir les jours manquants avec 0 (pour graphe continu)
  if (dateFrom) {
    const cursor = new Date(dateFrom);
    while (cursor <= dateTo) {
      const key = cursor.toISOString().split("T")[0];
      if (!map.has(key)) map.set(key, 0);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

/**
 * Fusionne 3 timelines (vues, réactions, commentaires) sur les mêmes dates.
 */
function mergeDailyTimelines(
  views: { date: string; count: number }[],
  reactions: { date: string; count: number }[],
  comments: { date: string; count: number }[]
) {
  const allDates = new Set([
    ...views.map((v) => v.date),
    ...reactions.map((r) => r.date),
    ...comments.map((c) => c.date),
  ]);

  const viewMap = Object.fromEntries(views.map((v) => [v.date, v.count]));
  const reactionMap = Object.fromEntries(
    reactions.map((r) => [r.date, r.count])
  );
  const commentMap = Object.fromEntries(
    comments.map((c) => [c.date, c.count])
  );

  return Array.from(allDates)
    .sort()
    .map((date) => ({
      date,
      views: viewMap[date] ?? 0,
      reactions: reactionMap[date] ?? 0,
      comments: commentMap[date] ?? 0,
    }));
}