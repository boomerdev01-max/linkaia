// app/api/subscriptions/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { convertFromXOF, CURRENCY_SYMBOLS } from "@/lib/currency";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();

    if (!auth.authorized) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    const body = await request.json();
    const { subscriptionTypeId, period, currency = "XOF" } = body; // period: 'monthly' | 'yearly'

    // Récupérer le type d'abonnement
    const subscriptionType = await prisma.subscriptionType.findUnique({
      where: { id: subscriptionTypeId },
      include: { currency: true },
    });

    if (!subscriptionType) {
      return NextResponse.json(
        { success: false, error: "Plan invalide" },
        { status: 400 },
      );
    }

    // Ne pas créer de session pour le plan gratuit
    if (subscriptionType.code === "FREE") {
      return NextResponse.json(
        {
          success: false,
          error: "Le plan gratuit ne nécessite pas de paiement",
        },
        { status: 400 },
      );
    }

    // Vérifier que l'utilisateur est bien défini
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non authentifié" },
        { status: 401 },
      );
    }

    // Récupérer ou créer le client Stripe
    let stripeCustomer = await prisma.stripeCustomer.findUnique({
      where: { userId: auth.user.id },
    });

    let customerId: string;

    if (!stripeCustomer) {
      const customer = await stripe.customers.create({
        email: auth.user.email,
        metadata: {
          userId: auth.user.id,
        },
      });

      stripeCustomer = await prisma.stripeCustomer.create({
        data: {
          userId: auth.user.id,
          stripeCustomerId: customer.id,
          email: auth.user.email,
        },
      });

      customerId = customer.id;
    } else {
      customerId = stripeCustomer.stripeCustomerId;
    }

    // Déterminer le prix en XOF
    const priceXOF =
      period === "yearly"
        ? subscriptionType.priceYear
        : subscriptionType.priceMonth;

    // Convertir vers la devise choisie
    const price = convertFromXOF(priceXOF, currency as any);
    const priceInCents = Math.round(price * 100); // Convertir en centimes

    // Créer la session de paiement Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: subscriptionType.name,
              description: subscriptionType.description || undefined,
            },
            unit_amount: priceInCents,
            recurring: {
              interval: period === "yearly" ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId: auth.user.id,
        subscriptionTypeId: subscriptionType.id,
        period,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
