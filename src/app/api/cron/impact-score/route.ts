// src/app/api/cron/impact-score/route.ts
// GET /api/cron/impact-score — Recalcule l'Impact Score de tous les créateurs
//
// À appeler via un cron job (Vercel Cron, GitHub Actions, etc.) toutes les heures.
// En local, appeler manuellement : GET http://localhost:3000/api/cron/impact-score
//
// Sécurité : protégé par CRON_SECRET (header Authorization: Bearer <secret>)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

export async function GET(request: NextRequest) {
  // Vérification du secret (sauf en développement)
  if (process.env.NODE_ENV !== "development") {
    const auth = request.headers.get("authorization");
    if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // Récupérer tous les utilisateurs avec des cadeaux reçus
    const usersWithGifts = await prisma.sentGift.groupBy({
      by: ["receiverId"],
      _sum: { lgemsAmount: true, diamondsAwarded: true, impactAmount: true },
      _count: { id: true },
    });

    let updated = 0;

    for (const agg of usersWithGifts) {
      const { receiverId, _sum, _count } = agg;

      // FIX #1 : ImpactLog n'a pas de champ userId — c'est un agrégat par cause ONG.
      // On lit directement impactAmount depuis le groupBy SentGift ci-dessus.
      const totalLgemsReceived = _sum?.lgemsAmount ?? 0;
      const totalDiamondsReceived = _sum?.diamondsAwarded ?? 0;
      // FIX #2 : _sum est potentiellement undefined → opérateur ?. sur chaque champ
      const totalImpactGenerated = _sum?.impactAmount ?? 0;
      const totalGiftsReceived = _count.id;

      // Formule Impact Score (0–100) :
      // - 40% basé sur le nombre de cadeaux reçus (normalisé sur 50)
      // - 40% basé sur le montant total de L-Gems reçus (normalisé sur 5000)
      // - 20% basé sur l'impact ONG généré (normalisé sur 500)
      const giftScore = Math.min(40, (totalGiftsReceived / 50) * 40);
      const lgemsScore = Math.min(40, (totalLgemsReceived / 5000) * 40);
      const impactScore_ = Math.min(20, (totalImpactGenerated / 500) * 20);

      const impactScore = Math.round(giftScore + lgemsScore + impactScore_);

      // Upsert CreatorScore
      await prisma.creatorScore.upsert({
        where: { userId: receiverId },
        update: {
          totalLgemsEarned: totalLgemsReceived,
          totalDiamondsEarned: totalDiamondsReceived,
          totalImpactGenerated,
          impactScore,
        },
        create: {
          userId: receiverId,
          totalLgemsEarned: totalLgemsReceived,
          totalDiamondsEarned: totalDiamondsReceived,
          totalImpactGenerated,
          impactScore,
        },
      });

      // Attribution des badges
      await assignBadges(receiverId, {
        totalGiftsReceived,
        totalLgemsReceived,
        impactScore,
        totalImpactGenerated,
      });

      updated++;
    }

    return NextResponse.json({
      success: true,
      message: `${updated} créateurs mis à jour`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/impact-score]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── Attribution automatique des badges ───────────────────────────────────────
async function assignBadges(
  userId: string,
  stats: {
    totalGiftsReceived: number;
    totalLgemsReceived: number;
    impactScore: number;
    totalImpactGenerated: number;
  },
) {
  const {
    totalGiftsReceived,
    totalLgemsReceived,
    impactScore,
    totalImpactGenerated,
  } = stats;

  const rules: { code: string; condition: boolean }[] = [
    { code: "philanthrope_1", condition: totalGiftsReceived >= 5 },
    { code: "philanthrope_2", condition: totalGiftsReceived >= 50 },
    { code: "philanthrope_3", condition: totalGiftsReceived >= 500 },
    { code: "pont_cultures_1", condition: totalLgemsReceived >= 100 },
    { code: "pont_cultures_2", condition: totalLgemsReceived >= 1000 },
    { code: "pont_cultures_3", condition: totalLgemsReceived >= 10000 },
    { code: "legende_1", condition: impactScore >= 25 },
    { code: "legende_2", condition: impactScore >= 60 },
    { code: "legende_3", condition: impactScore >= 90 },
    { code: "ambassadeur_paix", condition: totalImpactGenerated >= 100 },
  ];

  for (const rule of rules) {
    if (!rule.condition) continue;

    const badge = await prisma.badge.findUnique({ where: { code: rule.code } });
    if (!badge) continue;

    await prisma.userBadge
      .upsert({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
        update: {},
        create: { userId, badgeId: badge.id },
      })
      .catch(() => {
        /* badge déjà attribué — race condition safe */
      });
  }
}
