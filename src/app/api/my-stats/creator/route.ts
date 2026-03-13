// src/app/api/my-stats/creator/route.ts
// GET /api/my-stats/creator — Données monétisation pour le dashboard créateur
//
// Query params: period = "7d" | "30d" | "all" | "custom", from, to

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "30d";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Calcul de la plage (même logique que /api/my-stats)
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

  try {
    // ── 1. Score créateur ──────────────────────────────────────────────────
    const creatorScore = await prisma.creatorScore.findUnique({
      where: { userId: user.id },
    });

    // ── 2. Cadeaux reçus sur la période ───────────────────────────────────
    const giftsReceived = await prisma.sentGift.findMany({
      where: {
        receiverId: user.id,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      include: {
        gift: {
          select: { code: true, name: true, emoji: true, category: true },
        },
        sender: {
          select: {
            profil: { select: { pseudo: true, profilePhotoUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Totaux cadeaux
    const totalLgemsFromGifts = giftsReceived.reduce(
      (s, g) => s + g.lgemsAmount,
      0,
    );
    const totalDiamondsFromGifts = giftsReceived.reduce(
      (s, g) => s + g.diamondsAwarded,
      0,
    );
    const totalImpact = giftsReceived.reduce((s, g) => s + g.impactAmount, 0);

    // Répartition par type de cadeau
    const giftsByType = giftsReceived.reduce(
      (acc, g) => {
        const key = g.gift.code;
        if (!acc[key]) {
          acc[key] = {
            code: g.gift.code,
            name: g.gift.name,
            emoji: g.gift.emoji,
            count: 0,
            totalLgems: 0,
          };
        }
        acc[key].count++;
        acc[key].totalLgems += g.lgemsAmount;
        return acc;
      },
      {} as Record<
        string,
        {
          code: string;
          name: string;
          emoji: string;
          count: number;
          totalLgems: number;
        }
      >,
    );

    // ── 3. Lives hostés ────────────────────────────────────────────────────
    const lives = await prisma.live.findMany({
      where: {
        hostId: user.id,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        isFree: true,
        ticketPriceLgems: true,
        peakViewers: true,
        totalGiftsLgems: true,
        totalTicketsSold: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalLivesRevenue = lives.reduce(
      (s, l) => s + l.totalGiftsLgems + l.totalTicketsSold * l.ticketPriceLgems,
      0,
    );

    // ── 4. Tickets vendus ──────────────────────────────────────────────────
    const liveIds = lives.map((l) => l.id);
    const ticketsSold =
      liveIds.length > 0
        ? await prisma.liveTicket.count({ where: { liveId: { in: liveIds } } })
        : 0;

    // ── 5. Badges ──────────────────────────────────────────────────────────
    const badges = await prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    });

    // ── 6. Évolution journalière des cadeaux (timeline) ────────────────────
    const giftsTimeline = buildGiftsTimeline(giftsReceived, dateFrom, dateTo);

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateFrom: dateFrom?.toISOString() ?? null,
        dateTo: dateTo.toISOString(),

        // Score global
        impactScore: creatorScore?.impactScore ?? 0,
        bonusEligible: creatorScore?.bonusEligible ?? false,

        // Wallet lifetime
        lifetime: {
          totalLgemsEarned: creatorScore?.totalLgemsEarned ?? 0,
          totalDiamondsEarned: creatorScore?.totalDiamondsEarned ?? 0,
          totalImpactGenerated: creatorScore?.totalImpactGenerated ?? 0,
        },

        // Période sélectionnée
        period_stats: {
          totalLgemsFromGifts,
          totalDiamondsFromGifts,
          totalImpact,
          totalLivesRevenue,
          ticketsSold,
          giftsReceivedCount: giftsReceived.length,
          livesCount: lives.length,
        },

        giftsByType: Object.values(giftsByType).sort(
          (a, b) => b.totalLgems - a.totalLgems,
        ),
        recentGifts: giftsReceived.slice(0, 10).map((g) => ({
          id: g.id,
          giftName: g.gift.name,
          giftEmoji: g.gift.emoji,
          lgemsAmount: g.lgemsAmount,
          diamondsAwarded: g.diamondsAwarded,
          senderPseudo: g.sender.profil?.pseudo ?? "Utilisateur",
          senderAvatar: g.sender.profil?.profilePhotoUrl ?? null,
          liveId: g.liveId,
          postId: g.postId,
          createdAt: g.createdAt.toISOString(),
        })),

        lives: lives.slice(0, 10),
        giftsTimeline,
        badges: badges.map((b) => ({
          code: b.badge.code,
          name: b.badge.name,
          emoji: b.badge.emoji,
          level: b.badge.level,
          earnedAt: b.earnedAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    console.error("[GET /api/my-stats/creator]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function buildGiftsTimeline(
  gifts: { createdAt: Date; lgemsAmount: number; diamondsAwarded: number }[],
  dateFrom: Date | null,
  dateTo: Date,
) {
  const map = new Map<string, { lgems: number; diamonds: number }>();

  for (const g of gifts) {
    const key = g.createdAt.toISOString().split("T")[0];
    const existing = map.get(key) ?? { lgems: 0, diamonds: 0 };
    map.set(key, {
      lgems: existing.lgems + g.lgemsAmount,
      diamonds: existing.diamonds + g.diamondsAwarded,
    });
  }

  // Remplir les jours sans cadeaux avec 0
  if (dateFrom) {
    const cursor = new Date(dateFrom);
    while (cursor <= dateTo) {
      const key = cursor.toISOString().split("T")[0];
      if (!map.has(key)) map.set(key, { lgems: 0, diamonds: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date, ...vals }));
}
