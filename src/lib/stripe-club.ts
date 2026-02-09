// lib/stripe-club.ts
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

// Prix du Club LWB
export const CLUB_PRICES = {
  monthly: {
    priceId: process.env.STRIPE_CLUB_LWB_MONTHLY_PRICE_ID!,
    amount: 10500, // FCFA
    amountEur: 15, // EUR
  },
  yearly: {
    priceId: process.env.STRIPE_CLUB_LWB_YEARLY_PRICE_ID!,
    amount: 126000, // FCFA (10% de réduction)
    amountEur: 180, // EUR
  },
};

// Webhook secret pour le Club LWB (utilise le même que les autres subscriptions)
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Créer ou récupérer un client Stripe pour le Club LWB
 */
export async function getOrCreateClubStripeCustomer(
  userId: string,
  email: string,
): Promise<string> {
  // Chercher un customer existant par metadata
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id;
  }

  // Créer un nouveau customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
      service: "club_lwb",
    },
  });

  return customer.id;
}

/**
 * Créer une session de checkout Stripe pour le Club LWB
 */
export async function createClubCheckoutSession(
  customerId: string,
  userId: string,
  period: "monthly" | "yearly",
  currency: "xof" | "eur" = "xof",
): Promise<Stripe.Checkout.Session> {
  const priceId = CLUB_PRICES[period].priceId;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/club?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/club/checkout?canceled=true`,
    metadata: {
      userId,
      service: "club_lwb",
      period,
      currency,
    },
  });

  return session;
}

/**
 * Annuler un abonnement Stripe Club LWB
 */
export async function cancelClubSubscription(
  stripeSubscriptionId: string,
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Réactiver un abonnement Club LWB annulé
 */
export async function reactivateClubSubscription(
  stripeSubscriptionId: string,
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
}
