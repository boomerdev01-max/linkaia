// src/app/api/wallet/packs/route.ts
// GET /api/wallet/packs — Liste des packs L-Gems disponibles à l'achat

import { NextResponse } from "next/server";
import { LGEMS_PACKS } from "@/lib/stripe-lgems";

export async function GET() {
  // On retourne les packs depuis la config (source unique de vérité)
  // Pas besoin de DB : les packs sont définis dans stripe-lgems.ts
  const packs = Object.values(LGEMS_PACKS).map((pack) => ({
    code: pack.code,
    name: pack.name,
    description: pack.description,
    lgemsAmount: pack.lgemsAmount,
    bonusLgems: pack.bonusLgems,
    totalLgems: pack.totalLgems,
    priceEur: pack.priceEur,
    priceXof: pack.priceXof,
    isFeatured: pack.isFeatured,
    badgeColor: pack.badgeColor,
  }));

  return NextResponse.json({ success: true, data: packs });
}