// src/app/api/ads/campaigns/[id]/refund/route.ts
// Remboursement du solde résiduel lors de l'annulation d'une campagne

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { user, error } = await getAuthenticatedUser();
    if (!user || error) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const campaign = await prisma.adCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 },
      );
    }

    if (campaign.advertiserId !== user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // On ne peut annuler que les campagnes actives ou en pause
    if (!["active", "paused", "pending"].includes(campaign.status)) {
      return NextResponse.json(
        { error: "Cette campagne ne peut pas être annulée" },
        { status: 400 },
      );
    }

    const remainingBudget = campaign.totalBudget - campaign.amountSpent;

    // Mettre la campagne en statut "ended" dans tous les cas
    await prisma.$transaction(async (tx) => {
      await tx.adCampaign.update({
        where: { id },
        data: { status: "ended" },
      });

      // S'il reste du budget et qu'un Payment Intent Stripe existe → remboursement
      if (remainingBudget > 0.5 && campaign.stripePaymentIntentId) {
        // Remboursement Stripe (en centimes)
        const refundAmountCents = Math.floor(remainingBudget * 100);

        try {
          await stripe.refunds.create({
            payment_intent: campaign.stripePaymentIntentId,
            amount: refundAmountCents,
            reason: "requested_by_customer",
          });
        } catch (stripeErr) {
          console.error("⚠️ Stripe refund échoué (non bloquant):", stripeErr);
          // On ne bloque pas la transaction Prisma — on log juste
        }

        // Enregistrer la transaction de remboursement dans notre historique
        const balanceBefore = remainingBudget;

        await tx.adCreditTransaction.create({
          data: {
            campaignId: id,
            type: "refund",
            amountEur: remainingBudget, // positif = crédit remboursé
            balanceBefore,
            balanceAfter: 0,
            referenceType: "campaign",
            referenceId: id,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      refunded: remainingBudget > 0.5,
      refundedAmount: remainingBudget > 0.5 ? remainingBudget : 0,
    });
  } catch (err) {
    console.error("❌ POST /api/ads/campaigns/[id]/refund:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
