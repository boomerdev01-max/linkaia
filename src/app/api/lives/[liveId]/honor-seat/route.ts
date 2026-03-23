// src/app/api/lives/[liveId]/honor-seat/route.ts  ← VERSION CORRIGÉE
// Correction : live.livekitRoomName est `string | null` dans Prisma mais
// generateLiveKitToken attend `string`. On ajoute un guard explicite.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { debitWallet } from "@/lib/wallet-service";
import { generateLiveKitToken } from "@/lib/livekit";

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
      select: {
        id: true,
        status: true,
        hostId: true,
        honorSeatEnabled: true,
        honorSeatPrice: true,
        honorSeatDuration: true,
        livekitRoomName: true,
      },
    });

    if (!live || live.status !== "live") {
      return NextResponse.json(
        { error: "Live non disponible ou pas en cours" },
        { status: 404 },
      );
    }

    if (!live.honorSeatEnabled) {
      return NextResponse.json(
        { error: "Le siège d'honneur n'est pas activé pour ce live" },
        { status: 400 },
      );
    }

    if (live.hostId === user.id) {
      return NextResponse.json(
        { error: "Le host ne peut pas acheter son propre siège d'honneur" },
        { status: 400 },
      );
    }

    // ✅ FIX : livekitRoomName est string | null → guard avant de passer à generateLiveKitToken
    if (!live.livekitRoomName) {
      return NextResponse.json(
        { error: "Ce live n'a pas de room LiveKit associée" },
        { status: 500 },
      );
    }

    // Débiter le wallet
    const debit = await debitWallet({
      userId: user.id,
      lgemsAmount: live.honorSeatPrice,
      description: "Siège d'honneur",
      referenceId: liveId,
      referenceType: "honor_seat",
    });

    if (!debit.success) {
      return NextResponse.json(
        { error: debit.error ?? "Solde L-Gems insuffisant" },
        { status: 402 },
      );
    }

    // Mettre à jour le LiveViewer → rôle honor_seat
    await prisma.liveViewer.upsert({
      where: { liveId_userId: { liveId, userId: user.id } },
      update: { role: "honor_seat" },
      create: {
        liveId,
        userId: user.id,
        role: "honor_seat",
        watchDurationSeconds: 0,
      },
    });

    const userName = (
      user.profil?.pseudo ?? `${user.prenom} ${user.nom}`
    ).trim();

    // live.livekitRoomName est maintenant garanti string (guard ci-dessus)
    const token = await generateLiveKitToken({
      roomName: live.livekitRoomName, // ✅ TypeScript sait que c'est string
      userId: user.id,
      userName,
      role: "host",
      ttl: live.honorSeatDuration * 60,
    });

    return NextResponse.json({
      success: true,
      token,
      durationMinutes: live.honorSeatDuration,
      lgemsPaid: live.honorSeatPrice,
    });
  } catch (error) {
    console.error("[API /lives/[liveId]/honor-seat] POST error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'achat du siège d'honneur" },
      { status: 500 },
    );
  }
}
