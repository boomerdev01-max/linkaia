// src/app/api/club/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  createClubCheckoutSession,
  getOrCreateClubStripeCustomer,
} from "@/lib/stripe-club";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();

    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    const body = await request.json();
    const { period } = body; // "monthly" | "yearly"

    if (!period || !["monthly", "yearly"].includes(period)) {
      return NextResponse.json(
        { success: false, error: "Période invalide" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur a déjà un abonnement actif au Club LWB
    const existingSubscription = await prisma.clubSubscription.findUnique({
      where: { userId: auth.user.id },
    });

    if (existingSubscription && existingSubscription.status === "active") {
      return NextResponse.json(
        {
          success: false,
          error: "Vous avez déjà un abonnement actif au Club LWB",
        },
        { status: 400 }
      );
    }

    // Créer ou récupérer le customer Stripe
    const customerId = await getOrCreateClubStripeCustomer(
      auth.user.id,
      auth.user.email
    );

    // Créer la session de checkout
    const session = await createClubCheckoutSession(
      customerId,
      auth.user.id,
      period
    );

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating club checkout session:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création de la session" },
      { status: 500 }
    );
  }
}