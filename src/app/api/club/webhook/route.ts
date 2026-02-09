// src/app/api/club/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe-club";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`Unhandled Club LWB event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const period = session.metadata?.period as "monthly" | "yearly";

  if (!userId || !period) {
    console.error("Missing metadata in checkout session");
    return;
  }

  // Calculer la date de fin
  const startDate = new Date();
  const endDate = new Date(startDate);
  if (period === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  const pricePaid = session.amount_total ? session.amount_total / 100 : 0;
  const currencyCode = session.currency?.toUpperCase() || "XOF";

  // Créer ou mettre à jour l'abonnement
  await prisma.clubSubscription.upsert({
    where: { userId },
    update: {
      startDate,
      endDate,
      stripeSubscriptionId: session.subscription as string,
      stripeCustomerId: session.customer as string,
      status: "active",
      autoRenew: true,
      period,
      pricePaid,
      currencyCode,
    },
    create: {
      userId,
      startDate,
      endDate,
      stripeSubscriptionId: session.subscription as string,
      stripeCustomerId: session.customer as string,
      status: "active",
      autoRenew: true,
      period,
      pricePaid,
      currencyCode,
    },
  });

  // Ajouter dans l'historique
  await prisma.clubSubscriptionHistory.create({
    data: {
      userId,
      action: "subscribed",
      startDate,
      endDate,
      pricePaid,
      currencyCode,
      period,
      stripeSubscriptionId: session.subscription as string,
    },
  });

  // Créer une notification
  await prisma.notification.create({
    data: {
      userId,
      type: "club_subscription_activated",
      title: "Bienvenue au Club fermé LWB ! 🎉",
      message:
        "Votre abonnement est actif. Profitez de tous nos contenus exclusifs.",
    },
  });

  console.log(`Club LWB subscription created for user ${userId}`);
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  },
) {
  // Extraction safe de subscription
  const subId = invoice.subscription
    ? typeof invoice.subscription === "string"
      ? invoice.subscription
      : (invoice.subscription?.id ?? null)
    : null;

  if (!subId) return;

  // Trouver l'abonnement correspondant
  const clubSubscription = await prisma.clubSubscription.findUnique({
    where: { stripeSubscriptionId: subId },
  });

  if (!clubSubscription) return;

  // Ajouter dans l'historique
  await prisma.clubSubscriptionHistory.create({
    data: {
      userId: clubSubscription.userId,
      action: "renewed",
      startDate: new Date(),
      pricePaid: invoice.amount_paid / 100,
      currencyCode: invoice.currency?.toUpperCase() || "XOF",
      period: clubSubscription.period,
      stripeSubscriptionId: subId,
      stripeInvoiceId: invoice.id,
    },
  });

  console.log(`Club LWB invoice paid for subscription ${subId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const clubSubscription = await prisma.clubSubscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!clubSubscription) return;

  const status = subscription.status === "active" ? "active" : "cancelled";

  await prisma.clubSubscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status,
      autoRenew: !subscription.cancel_at_period_end,
    },
  });

  console.log(`Club LWB subscription updated: ${subscription.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const clubSubscription = await prisma.clubSubscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!clubSubscription) return;

  // Marquer comme expiré
  await prisma.clubSubscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "expired",
      autoRenew: false,
    },
  });

  // Ajouter dans l'historique
  await prisma.clubSubscriptionHistory.create({
    data: {
      userId: clubSubscription.userId,
      action: "expired",
      startDate: clubSubscription.startDate,
      endDate: new Date(),
      pricePaid: clubSubscription.pricePaid,
      currencyCode: clubSubscription.currencyCode,
      period: clubSubscription.period,
      stripeSubscriptionId: subscription.id,
    },
  });

  // Créer une notification
  await prisma.notification.create({
    data: {
      userId: clubSubscription.userId,
      type: "club_subscription_expired",
      title: "Abonnement Club LWB expiré",
      message:
        "Votre abonnement au Club fermé LWB a expiré. Renouvelez-le pour continuer à profiter des contenus exclusifs.",
    },
  });

  console.log(`Club LWB subscription deleted: ${subscription.id}`);
}
