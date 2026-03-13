// src/app/api/wallet/purchase/route.ts
// POST /api/wallet/purchase — Crée un Payment Intent Stripe pour acheter des L-Gems
//
// Body: { packCode: "starter_100" | "popular_500" | "pro_1000" | "elite_5000", currency?: "eur" | "xof" }
// Retourne: { clientSecret, paymentIntentId } pour Stripe.js côté client

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import {
  createLGemsPurchaseIntent,
  LGEMS_PACKS,
  type LGemsPackCode,
} from "@/lib/stripe-lgems";

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  let body: { packCode?: string; currency?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const { packCode, currency = "eur" } = body;

  if (!packCode || !LGEMS_PACKS[packCode as LGemsPackCode]) {
    return NextResponse.json(
      {
        error: `Pack invalide. Valeurs acceptées: ${Object.keys(LGEMS_PACKS).join(", ")}`,
      },
      { status: 400 },
    );
  }

  if (currency !== "eur" && currency !== "xof") {
    return NextResponse.json(
      { error: "Devise invalide. Valeurs acceptées: eur, xof" },
      { status: 400 },
    );
  }

  try {
    const result = await createLGemsPurchaseIntent(
      user.id,
      packCode as LGemsPackCode,
      currency as "eur" | "xof",
    );

    const pack = LGEMS_PACKS[packCode as LGemsPackCode];

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        pack: {
          code: pack.code,
          name: pack.name,
          totalLgems: pack.totalLgems,
          priceEur: pack.priceEur,
        },
      },
    });
  } catch (err: any) {
    console.error("[POST /api/wallet/purchase]", err);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 },
    );
  }
}
