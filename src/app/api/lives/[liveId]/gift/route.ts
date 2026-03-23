// src/app/api/lives/[liveId]/gift/route.ts  ← VERSION CORRIGÉE
//
// Corrections apportées :
//   1. SendGiftParams attend `giftId` (UUID Prisma), pas `giftCode` (string code).
//      → On résout d'abord le code en ID via une lookup VirtualGift.
//   2. live.livekitRoomName est `string | null` dans join/route.ts (même guard
//      que honor-seat) — non bloquant ici car on n'utilise pas roomName dans ce
//      fichier, mais on documente la cohérence.
//   3. Le broadcast utilise les champs plats de sentGift (giftName, giftEmoji,
//      lgemsAmount) plutôt que result.sentGift.gift.xxx qui n'existe plus.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { sendGift } from "@/lib/wallet-service";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

type Params = { params: Promise<{ liveId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAuth();

  if (!auth.authorized) {
    return NextResponse.json(auth.errorResponse, { status: auth.status });
  }

  if (!auth.user) {
    return NextResponse.json(
      { error: "Session invalide – utilisateur manquant" },
      { status: 401 },
    );
  }

  const user = auth.user;
  const { liveId } = await params;

  try {
    const live = await prisma.live.findUnique({
      where: { id: liveId },
      select: { id: true, status: true, hostId: true, title: true },
    });

    if (!live || live.status === "ended") {
      return NextResponse.json(
        { error: "Live non disponible ou terminé" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { giftCode, message } = body;

    if (!giftCode) {
      return NextResponse.json({ error: "giftCode requis" }, { status: 400 });
    }

    // ✅ FIX 1 : SendGiftParams attend giftId (UUID), pas giftCode.
    // On résout le code → ID avant d'appeler sendGift().
    const gift = await prisma.virtualGift.findUnique({
      where: { code: giftCode },
      select: { id: true, name: true, lgemsValue: true, animationUrl: true },
    });

    if (!gift) {
      return NextResponse.json(
        { error: `Cadeau "${giftCode}" introuvable` },
        { status: 400 },
      );
    }

    // sendGift() reçoit maintenant giftId (UUID) — conforme à SendGiftParams
    const result = await sendGift({
      senderId: user.id,
      receiverId: live.hostId,
      giftId: gift.id, // ✅ giftId et non giftCode
      liveId,
    });

    if (!result.success || !result.sentGift) {
      return NextResponse.json(
        { error: result.error ?? "Échec de l'envoi du cadeau" },
        { status: 402 },
      );
    }

    // ✅ FIX 2 : sentGift est de forme plate { id, giftName, giftEmoji, lgemsAmount, … }
    // On n'accède plus à result.sentGift.gift.xxx (la propriété gift n'est pas
    // garantie dans SendGiftResult). On utilise les champs plats + la lookup gift
    // résolue juste au-dessus pour les champs manquants (animationUrl).
    await supabaseAdmin.channel(`live:${liveId}`).send({
      type: "broadcast",
      event: "gift",
      payload: {
        giftId: result.sentGift.id,
        giftCode,
        giftName: result.sentGift.giftName,
        animationUrl: gift.animationUrl ?? null, // depuis la lookup locale
        lgemsValue: result.sentGift.lgemsAmount,
        sender: {
          id: user.id,
          name: user.profil?.pseudo ?? `${user.prenom} ${user.nom}`.trim(),
          avatar: user.profil?.profilePhotoUrl ?? null,
        },
        message: message ?? null,
        sentAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true, sentGift: result.sentGift });
  } catch (error) {
    console.error("[API /lives/[liveId]/gift] POST error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'envoi du cadeau" },
      { status: 500 },
    );
  }
}
