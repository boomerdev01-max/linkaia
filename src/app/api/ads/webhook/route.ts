// src/app/api/ads/webhook/route.ts
// Webhook Stripe dédié aux paiements publicitaires
// À enregistrer dans Stripe Dashboard avec l'event : payment_intent.succeeded

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const AD_WEBHOOK_SECRET = process.env.STRIPE_AD_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, AD_WEBHOOK_SECRET);
  } catch (err) {
    console.error("❌ Webhook signature invalide:", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;

    // Vérifier que c'est bien un paiement pub
    if (intent.metadata?.type !== "ad_budget") {
      return NextResponse.json({ received: true });
    }

    const { campaignId, userId } = intent.metadata;
    const amountEur = intent.amount / 100;

    try {
      const campaign = await prisma.adCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        console.error("❌ Campagne introuvable pour le webhook:", campaignId);
        return NextResponse.json({ received: true });
      }

      // Idempotence — vérifier si ce Payment Intent a déjà été traité
      const existing = await prisma.adCreditTransaction.findFirst({
        where: {
          campaignId,
          stripePaymentIntentId: intent.id,
          type: "topup",
        },
      });

      if (existing) {
        console.log("ℹ️ Payment Intent déjà traité:", intent.id);
        return NextResponse.json({ received: true });
      }

      await prisma.$transaction(async (tx) => {
        const balanceBefore = campaign.totalBudget - campaign.amountSpent;
        const balanceAfter = balanceBefore + amountEur;

        // Enregistrer la transaction de crédit
        await tx.adCreditTransaction.create({
          data: {
            campaignId,
            type: "topup",
            amountEur,
            balanceBefore,
            balanceAfter,
            stripePaymentIntentId: intent.id,
          },
        });

        // Augmenter le budget total de la campagne
        await tx.adCampaign.update({
          where: { id: campaignId },
          data: {
            totalBudget: { increment: amountEur },
            stripePaymentIntentId: intent.id,
          },
        });
      });

      console.log(
        `✅ Budget pub rechargé : +${amountEur}€ → campagne ${campaignId}`,
      );
    } catch (err) {
      console.error("❌ Erreur traitement webhook pub:", err);
      return NextResponse.json({ error: "Erreur traitement" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
