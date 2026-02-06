// src/app/api/subscriptions/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import {
  notifySubscriptionActivated,
  notifySubscriptionExpired,
} from "@/lib/notification-helpers";

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
        const invoice = event.data.object as any;
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
        console.log(`Unhandled event type: ${event.type}`);
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
  const subscriptionTypeId = session.metadata?.subscriptionTypeId;
  const period = session.metadata?.period;

  if (!userId || !subscriptionTypeId) {
    console.error("Missing metadata in checkout session");
    return;
  }

  const subscriptionType = await prisma.subscriptionType.findUnique({
    where: { id: subscriptionTypeId },
  });

  if (!subscriptionType) return;

  // Calculer la date de fin
  const startDate = new Date();
  const endDate = new Date(startDate);
  if (period === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  // Mettre à jour ou créer l'abonnement actif
  await prisma.userSubscription.upsert({
    where: { userId },
    update: {
      subscriptionTypeId,
      startDate,
      endDate,
      stripeSubscriptionId: session.subscription as string,
      status: "active",
      autoRenew: true,
    },
    create: {
      userId,
      subscriptionTypeId,
      startDate,
      endDate,
      stripeSubscriptionId: session.subscription as string,
      status: "active",
      autoRenew: true,
    },
  });

  // Mettre à jour le level de l'utilisateur
  await prisma.user.update({
    where: { id: userId },
    data: { level: subscriptionType.code.toLowerCase() },
  });

  // Ajouter dans l'historique
  await prisma.subscriptionHistory.create({
    data: {
      userId,
      subscriptionTypeId,
      startDate,
      endDate,
      action: "subscribed",
      pricePaid: session.amount_total ? session.amount_total / 100 : 0,
      currencyCode: session.currency?.toUpperCase(),
      stripeSubscriptionId: session.subscription as string,
    },
  });

  // ✨ Créer une notification d'abonnement activé
  await notifySubscriptionActivated(userId, subscriptionType.name);

  console.log(`Subscription created for user ${userId}`);
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  },
) {
  const customerId = invoice.customer as string;

  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!stripeCustomer) return;

  // Trouver la devise
  const currency = await prisma.currency.findUnique({
    where: { code: invoice.currency?.toUpperCase() ?? "EUR" },
  });

  if (!currency) return;

  // Extraction safe de subscription
  const subId = invoice.subscription
    ? typeof invoice.subscription === "string"
      ? invoice.subscription
      : (invoice.subscription?.id ?? null)
    : null;

  // Enregistrer la facture
  await prisma.stripeInvoice.create({
    data: {
      stripeCustomerId: stripeCustomer.id,
      stripeInvoiceId: invoice.id,
      stripeSubscriptionId: subId,
      amountPaid: invoice.amount_paid / 100,
      currencyId: currency.code,
      status: invoice.status || "paid",
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      invoicePdf: invoice.invoice_pdf ?? null,
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : null,
    },
  });

  console.log(
    `Invoice saved for customer ${customerId} (subscription: ${subId ?? "none"})`,
  );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!stripeCustomer) return;

  // Mettre à jour le statut
  const status = subscription.status === "active" ? "active" : "cancelled";

  await prisma.userSubscription.update({
    where: { userId: stripeCustomer.userId },
    data: {
      status,
      autoRenew: subscription.cancel_at_period_end ? false : true,
    },
  });

  console.log(`Subscription updated for user ${stripeCustomer.userId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!stripeCustomer) return;

  // Récupérer le plan FREE
  const freePlan = await prisma.subscriptionType.findUnique({
    where: { code: "FREE" },
  });

  if (!freePlan) return;

  // Récupérer l'ancien abonnement pour la notification
  const oldSubscription = await prisma.userSubscription.findUnique({
    where: { userId: stripeCustomer.userId },
    include: {
      subscriptionType: true,
    },
  });

  // Downgrade vers FREE
  await prisma.userSubscription.update({
    where: { userId: stripeCustomer.userId },
    data: {
      subscriptionTypeId: freePlan.id,
      status: "active",
      endDate: null,
      autoRenew: false,
      stripeSubscriptionId: null,
    },
  });

  // Mettre à jour le level
  await prisma.user.update({
    where: { id: stripeCustomer.userId },
    data: { level: "free" },
  });

  // Ajouter dans l'historique
  await prisma.subscriptionHistory.create({
    data: {
      userId: stripeCustomer.userId,
      subscriptionTypeId: freePlan.id,
      startDate: new Date(),
      action: "downgraded",
      pricePaid: 0,
      currencyCode: "XOF",
    },
  });

  // ✨ Créer une notification d'abonnement expiré
  if (oldSubscription) {
    await notifySubscriptionExpired(
      stripeCustomer.userId,
      oldSubscription.subscriptionType.name,
    );
  }

  console.log(`Subscription cancelled for user ${stripeCustomer.userId}`);
}
