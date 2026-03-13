// src/app/api/wallet/transactions/route.ts
// GET /api/wallet/transactions — Historique des transactions du wallet
//
// Query params:
//   page     (défaut: 1)
//   limit    (défaut: 20, max: 50)
//   type     filtre par type ("purchase", "gift_sent", etc.)
//   currency filtre par devise ("LGEMS" ou "DIAMONDS")

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { getWalletTransactions } from "@/lib/wallet-service";

export async function GET(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20")),
  );
  const type = searchParams.get("type") ?? undefined;
  const currency = searchParams.get("currency") ?? undefined;

  const result = await getWalletTransactions(user.id, {
    page,
    limit,
    type,
    currency,
  });

  return NextResponse.json({ success: true, data: result });
}
