// ═══════════════════════════════════════════════════════════════════════════
// src/app/api/wallet/balance/route.ts
// GET /api/wallet/balance — Solde du wallet de l'utilisateur connecté
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { getWalletBalance, getOrCreateWallet } from "@/lib/wallet-service";

export async function GET() {
  const { user, error } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  // Crée le wallet s'il n'existe pas encore (premier accès)
  await getOrCreateWallet(user.id);
  const balance = await getWalletBalance(user.id);

  return NextResponse.json({ success: true, data: balance });
}
