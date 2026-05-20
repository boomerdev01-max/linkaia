// src/app/api/ads/track/click/route.ts
// Enregistre un clic publicitaire et débite le budget CPC

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
    const { campaignId, destination } = body as {
      campaignId: string;
      destination: string;
    };

    if (!campaignId || !destination) {
      return NextResponse.json(
        { success: false, error: "campaignId et destination requis" },
        { status: 400 },
      );
    }

    const campaign = await prisma.adCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign || campaign.status !== "active") {
      return NextResponse.json({ success: false });
    }

    const costEur = computeAdCost(
      campaign.billingModel,
      campaign.cpmRate,
      campaign.cpcRate,
      "click",
    );

    const remaining = campaign.totalBudget - campaign.amountSpent;
    if (remaining <= 0) {
      await prisma.adCampaign.update({
        where: { id: campaignId },
        data: { status: "ended" },
      });
      return NextResponse.json({ success: false, reason: "budget_exhausted" });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Enregistrer le clic
      const click = await tx.adClick.create({
        data: {
          campaignId,
          clickerId: user.id,
          costEur,
          destination,
        },
      });

      // 2. Transaction de débit
      const balanceBefore = campaign.totalBudget - campaign.amountSpent;
      const balanceAfter = balanceBefore - costEur;

      await tx.adCreditTransaction.create({
        data: {
          campaignId,
          type: "click",
          amountEur: -costEur,
          balanceBefore,
          balanceAfter,
          referenceId: click.id,
          referenceType: "click",
        },
      });

      // 3. Mettre à jour compteurs + CTR
      const newClicks = campaign.totalClicks + 1;
      const newImpressions = campaign.totalImpressions;
      const newCtr =
        newImpressions > 0 ? newClicks / newImpressions : 0;

      await tx.adCampaign.update({
        where: { id: campaignId },
        data: {
          amountSpent: { increment: costEur },
          totalClicks: { increment: 1 },
          ctr: newCtr,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ POST /api/ads/track/click:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}