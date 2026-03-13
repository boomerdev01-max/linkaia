// src/app/api/gifts/send/route.ts
// POST /api/gifts/send — Envoyer un cadeau virtuel à un créateur
//
// Body: { giftId, receiverId, quantity?, liveId?, postId?, message? }

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { sendGift } from "@/lib/wallet-service";

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  let body: {
    giftId?: string;
    receiverId?: string;
    quantity?: number;
    liveId?: string;
    postId?: string;
    message?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const { giftId, receiverId, quantity, liveId, postId, message } = body;

  if (!giftId || !receiverId) {
    return NextResponse.json(
      { error: "giftId et receiverId sont requis" },
      { status: 400 },
    );
  }

  // On ne peut pas envoyer à soi-même (vérifié aussi dans wallet-service)
  if (receiverId === user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas vous envoyer un cadeau" },
      { status: 400 },
    );
  }

  const result = await sendGift({
    senderId: user.id,
    receiverId,
    giftId,
    quantity: quantity ?? 1,
    liveId,
    postId,
    message,
  });

  if (!result.success) {
    // 402 Payment Required pour les erreurs de solde insuffisant
    const status = result.error?.includes("insuffisant") ? 402 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ success: true, data: result.sentGift });
}
