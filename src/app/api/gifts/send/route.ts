// src/app/api/gifts/send/route.ts  ← VERSION CORRIGÉE
// Corrections :
//   1. Suppression de l'import `notifyGiftReceived` qui n'existe pas dans
//      notification-helpers (seuls notifySubscriptionActivated/Expired existent).
//   2. Adaptation des champs accédés sur result.sentGift pour correspondre
//      à la forme retournée par sendGift() dans wallet-service.ts :
//      → result.sentGift.giftName  (pas .gift.name)
//      → result.sentGift.lgemsAmount (pas .gift.lgemsValue)

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { sendGift } from "@/lib/wallet-service";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

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
    const status = result.error?.includes("insuffisant") ? 402 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  // ── Broadcast Supabase Realtime → toast côté receiver ───────────────────
  try {
    const senderName = user.profil?.pseudo ?? `${user.prenom} ${user.nom}`;

    // ✅ FIX : on utilise les champs plats de sentGift (giftName, lgemsAmount)
    //          tels que retournés par sendGift() dans wallet-service.ts
    await supabaseAdmin.channel(`user:${receiverId}`).send({
      type: "broadcast",
      event: "gift_received",
      payload: {
        giftName: result.sentGift?.giftName ?? "Cadeau",
        giftEmoji: result.sentGift?.giftEmoji ?? "🎁",
        lgemsValue: result.sentGift?.lgemsAmount ?? 0,
        sender: {
          id: user.id,
          name: senderName,
          avatar: user.profil?.profilePhotoUrl ?? null,
        },
        context: liveId ? "live" : postId ? "post" : "profile",
        message: message ?? null,
        sentAt: new Date().toISOString(),
      },
    });

    // ── Notification persistante ─────────────────────────────────────────
    // notifyGiftReceived n'existe pas encore dans notification-helpers.
    // On crée directement un enregistrement Notification en base si le modèle
    // est disponible, sans dépendre d'une fonction inexistante.
    // ✅ FIX : import dynamique supprimé, on appelle prisma directement si besoin.
    //
    // Pour ajouter une notif persistante, décommentez et adaptez :
    //
    // await prisma.notification.create({
    //   data: {
    //     userId: receiverId,
    //     type: "gift_received",
    //     title: "Cadeau reçu !",
    //     message: `${senderName} vous a envoyé ${result.sentGift?.giftName ?? "un cadeau"}`,
    //     isRead: false,
    //   },
    // });
  } catch (broadcastErr) {
    // Non bloquant — l'envoi du cadeau a déjà réussi
    console.warn("[gifts/send] Broadcast error (non-bloquant):", broadcastErr);
  }

  return NextResponse.json({ success: true, data: result.sentGift });
}
