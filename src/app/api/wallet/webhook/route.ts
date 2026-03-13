// src/app/api/wallet/webhook/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Webhook Stripe dédié aux achats de L-Gems (Payment Intents)
//
// IMPORTANT : Ce webhook est SÉPARÉ du webhook existant pour les abonnements
// (/api/subscriptions/webhook). Chacun gère ses propres événements.
//
// En local, écouter ce webhook avec :
//   stripe.exe listen --forward-to localhost:3000/api/wallet/webhook
//
// Ou, si vous voulez un seul webhook, ajouter le case "payment_intent.succeeded"
// dans /api/subscriptions/webhook/route.ts et appeler handleLGemsPayment() depuis là.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-lgems";
import { creditLGemsFromPurchase } from "@/lib/wallet-service";
import Stripe from "stripe";

const WEBHOOK_SECRET =
  process.env.STRIPE_LGEMS_WEBHOOK_SECRET ??
  process.env.STRIPE_WEBHOOK_SECRET ??
  "";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (error) {
    console.error("[Wallet Webhook] Signature invalide:", error);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handleLGemsPayment(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.warn(`[Wallet Webhook] Paiement échoué : ${paymentIntent.id}`);
        // Pas d'action nécessaire : le wallet n'a pas été crédité
        break;
      }

      default:
        // Ignorer les autres événements silencieusement
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Wallet Webhook] Handler error:", error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler : paiement L-Gems confirmé
// ─────────────────────────────────────────────────────────────────────────────

async function handleLGemsPayment(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent;

  // Vérifier que c'est bien un achat L-Gems (et non un autre type de paiement)
  if (metadata?.type !== "lgems_purchase") {
    console.log(`[Wallet Webhook] Ignoré : type=${metadata?.type}`);
    return;
  }

  const { userId, packCode, lgemsToCredit } = metadata;

  if (!userId || !packCode || !lgemsToCredit) {
    console.error("[Wallet Webhook] Métadonnées manquantes :", metadata);
    return;
  }

  const lgemsAmount = parseInt(lgemsToCredit, 10);
  if (isNaN(lgemsAmount) || lgemsAmount <= 0) {
    console.error("[Wallet Webhook] lgemsToCredit invalide :", lgemsToCredit);
    return;
  }

  console.log(
    `[Wallet Webhook] Crédit ${lgemsAmount} L-Gems → user ${userId} (pack: ${packCode})`,
  );

  const result = await creditLGemsFromPurchase({
    userId,
    lgemsAmount,
    stripePaymentIntentId: paymentIntent.id,
    packCode,
  });

  if (result.alreadyProcessed) {
    console.log(`[Wallet Webhook] Déjà traité, skip.`);
    return;
  }

  if (!result.success) {
    throw new Error(`Échec du crédit L-Gems pour ${userId}`);
  }

  console.log(
    `[Wallet Webhook] ✅ ${lgemsAmount} L-Gems crédités → user ${userId}`,
  );
}
