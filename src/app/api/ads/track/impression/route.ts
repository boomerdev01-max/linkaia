// src/app/api/ads/track/impression/route.ts
// Enregistre une impression publicitaire et débite le budget CPM

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { computeAdCost } from "@/lib/ad-server";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (!user || error) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const body = await request.json();
    const { campaignId, feedPosition } = body as {
      campaignId: string;
      feedPosition?: number;
    };

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: "campaignId requis" },
        { status: 400 },
      );
    }

    // Récupérer la campagne
    const campaign = await prisma.adCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign || campaign.status !== "active") {
      return NextResponse.json({ success: false });
    }

    // Vérifier le cooldown 1h (pas d'impression dupliquée)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentImpression = await prisma.adImpression.findFirst({
      where: {
        campaignId,
        viewerId: user.id,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentImpression) {
      // Déjà vu, on ignore silencieusement
      return NextResponse.json({ success: true, skipped: true });
    }

    // Calculer le coût
    const costEur = computeAdCost(
      campaign.billingModel,
      campaign.cpmRate,
      campaign.cpcRate,
      "impression",
    );

    // Vérifier le budget restant
    const remaining = campaign.totalBudget - campaign.amountSpent;
    if (remaining <= 0) {
      // Plus de budget → mettre la campagne en pause
      await prisma.adCampaign.update({
        where: { id: campaignId },
        data: { status: "ended" },
      });
      return NextResponse.json({ success: false, reason: "budget_exhausted" });
    }

    // Vérifier le plafond journalier si défini
    if (campaign.dailyBudgetCap !== null) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todaySpent = await prisma.adCreditTransaction.aggregate({
        where: {
          campaignId,
          type: { in: ["impression", "click"] },
          createdAt: { gte: startOfDay },
        },
        _sum: { amountEur: true },
      });

      const todayTotal = Math.abs(todaySpent._sum.amountEur ?? 0);
      if (todayTotal >= campaign.dailyBudgetCap) {
        return NextResponse.json({
          success: false,
          reason: "daily_cap_reached",
        });
      }
    }

    // Enregistrer en transaction atomique
    await prisma.$transaction(async (tx) => {
      // 1. Impression
      const impression = await tx.adImpression.create({
        data: {
          campaignId,
          viewerId: user.id,
          costEur,
          feedPosition: feedPosition ?? null,
        },
      });

      // 2. Transaction de crédit (débit)
      const balanceBefore = campaign.totalBudget - campaign.amountSpent;
      const balanceAfter = balanceBefore - costEur;

      await tx.adCreditTransaction.create({
        data: {
          campaignId,
          type: "impression",
          amountEur: -costEur,
          balanceBefore,
          balanceAfter,
          referenceId: impression.id,
          referenceType: "impression",
        },
      });

      // 3. Mettre à jour les compteurs de la campagne
      await tx.adCampaign.update({
        where: { id: campaignId },
        data: {
          amountSpent: { increment: costEur },
          totalImpressions: { increment: 1 },
          // CTR sera recalculé dans un cron ou à chaque clic
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ POST /api/ads/track/impression:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
