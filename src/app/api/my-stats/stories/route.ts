// src/app/api/my-stats/stories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

/**
 * GET /api/my-stats/stories
 * Retourne les statistiques des stories de l'utilisateur connecté.
 *
 * Query params :
 *   period = "7d" | "30d" | "all" | "custom"
 *   from   = ISO date (si period=custom)
 *   to     = ISO date (si period=custom)
 *   page   = numéro de page (défaut: 1)
 *   limit  = nombre par page (défaut: 10)
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

    // ── Stats globales stories ───────────────────────────────────────────────
    const [totalStoriesViews, totalStoriesReactions, totalStories] =
      await Promise.all([
        prisma.storyView.count({
          where: {
            story: { userId: user.id },
            ...(dateFilter ? { viewedAt: dateFilter } : {}),
          },
        }),
        prisma.storyReaction.count({
          where: {
            story: { userId: user.id },
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        }),
        prisma.story.count({
          where: {
            userId: user.id,
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        }),
      ]);

    // ── Stories avec détails ─────────────────────────────────────────────────
    const stories = await prisma.story.findMany({
      where: {
        userId: user.id,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        isExpired: true,
        viewsCount: true,
        reactionsCount: true,
        slides: {
          select: {
            type: true,
            mediaUrl: true,
            textContent: true,
            bgColor: true,
            order: true,
          },
          orderBy: { order: "asc" },
          take: 1,
        },
        views: {
          where: dateFilter ? { viewedAt: dateFilter } : {},
          select: { id: true },
        },
        reactions: {
          where: dateFilter ? { createdAt: dateFilter } : {},
          select: { id: true, emoji: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Calculer les métriques ───────────────────────────────────────────────
    const storiesWithStats = stories.map((story) => {
      const viewsCount = story.views.length;
      const reactionsCount = story.reactions.length;

      // Répartition emojis
      const emojiMap: Record<string, number> = {};
      for (const r of story.reactions) {
        emojiMap[r.emoji] = (emojiMap[r.emoji] ?? 0) + 1;
      }
      const emojiBreakdown = Object.entries(emojiMap).map(([emoji, count]) => ({
        emoji,
        count,
      }));

      const firstSlide = story.slides[0] ?? null;

      return {
        id: story.id,
        createdAt: story.createdAt.toISOString(),
        expiresAt: story.expiresAt.toISOString(),
        isExpired: story.isExpired,
        preview: firstSlide
          ? {
              type: firstSlide.type,
              mediaUrl: firstSlide.mediaUrl,
              textContent: firstSlide.textContent,
              bgColor: firstSlide.bgColor,
            }
          : null,
        stats: {
          views: viewsCount,
          reactions: reactionsCount,
        },
        emojiBreakdown,
      };
    });

    // ── Pagination ───────────────────────────────────────────────────────────
    const total = storiesWithStats.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginated = storiesWithStats.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        totals: {
          stories: totalStories,
          views: totalStoriesViews,
          reactions: totalStoriesReactions,
        },
        stories: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
        period,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/my-stats/stories:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
