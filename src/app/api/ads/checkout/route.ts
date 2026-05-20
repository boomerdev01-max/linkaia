// src/app/api/ads/checkout/route.ts
// Crée un Stripe Payment Intent pour recharger le budget d'une campagne

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (!user || error) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { campaignId, amountEur } = body as {
      campaignId: string;
      amountEur: number;
    };

    if (!campaignId || !amountEur || amountEur < 5) {
      return NextResponse.json(
        { error: "campaignId et montant (min 5€) requis" },
        { status: 400 },
      );
    }

    const campaign = await prisma.adCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign || campaign.advertiserId !== user.id) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 },
      );
    }

    // Créer ou récupérer le StripeCustomer
    let stripeCustomerId: string | undefined;
    const existing = await prisma.stripeCustomer.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      stripeCustomerId = existing.stripeCustomerId;
    } else {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      const customer = await stripe.customers.create({
        email: dbUser?.email,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await prisma.stripeCustomer.create({
        data: {
          userId: user.id,
          stripeCustomerId: customer.id,
          email: dbUser?.email ?? "",
        },
      });
    }

    // Créer le Payment Intent (montant en centimes)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountEur * 100),
      currency: "eur",
      customer: stripeCustomerId,
      metadata: {
        type: "ad_budget",
        campaignId,
        userId: user.id,
      },
      description: `Budget publicitaire — Campagne "${campaign.name}"`,
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error("❌ POST /api/ads/checkout:", err);
    return NextResponse.json({ error: "Erreur Stripe" }, { status: 500 });
  }
}
