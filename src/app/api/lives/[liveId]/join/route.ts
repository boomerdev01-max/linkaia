// src/app/api/lives/[liveId]/join/route.ts  ← VERSION CORRIGÉE
//
// Correction : live.livekitRoomName est `string | null` dans le schéma Prisma,
// mais generateLiveKitToken() attend `string`.
// → Guard ajouté avant l'appel, identique au fix de honor-seat/route.ts.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { generateLiveKitToken } from "@/lib/livekit";
import { debitWallet } from "@/lib/wallet-service";

type Params = { params: Promise<{ liveId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAuth();

  if (!auth.authorized) {
    return NextResponse.json(auth.errorResponse, { status: auth.status });
  }

  if (!auth.user) {
    console.error(
      "[API /lives/[liveId]/join] authorized=true mais user absent",
    );
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
      include: {
        host: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            profil: { select: { pseudo: true, profilePhotoUrl: true } },
          },
        },
      },
    });

    if (!live) {
      return NextResponse.json({ error: "Live introuvable" }, { status: 404 });
    }

    if (live.status === "ended") {
      return NextResponse.json(
        { error: "Ce live est terminé" },
        { status: 410 },
      );
    }

    // ✅ FIX : livekitRoomName est string | null → guard avant generateLiveKitToken
    if (!live.livekitRoomName) {
      return NextResponse.json(
        { error: "Ce live n'a pas de room LiveKit associée" },
        { status: 500 },
      );
    }

    const isHost = live.hostId === user.id;

    if (
      !isHost &&
      !live.isFree &&
      live.ticketPriceLgems > 0 &&
      live.freeMinutes === 0
    ) {
      const existingTicket = await prisma.liveTicket.findUnique({
        where: { liveId_userId: { liveId, userId: user.id } },
      });

      if (!existingTicket) {
        const debitResult = await debitWallet({
          userId: user.id,
          lgemsAmount: live.ticketPriceLgems,
          description: `Ticket live : ${live.title}`,
          referenceId: liveId,
          referenceType: "live_ticket",
        });

        if (!debitResult.success) {
          return NextResponse.json(
            {
              error: "Solde L-Gems insuffisant pour rejoindre ce live payant",
              needsTicket: true,
              price: live.ticketPriceLgems,
            },
            { status: 402 },
          );
        }

        await prisma.liveTicket.create({
          data: { liveId, userId: user.id, lgemsPaid: live.ticketPriceLgems },
        });
      }
    }

    await prisma.liveViewer.upsert({
      where: { liveId_userId: { liveId, userId: user.id } },
      update: { role: isHost ? "host" : "viewer" },
      create: {
        liveId,
        userId: user.id,
        role: isHost ? "host" : "viewer",
        watchDurationSeconds: 0,
      },
    });

    const userName = (
      user.profil?.pseudo ?? `${user.prenom} ${user.nom}`
    ).trim();

    // live.livekitRoomName est maintenant garanti string (guard ci-dessus)
    const token = await generateLiveKitToken({
      roomName: live.livekitRoomName, // ✅ string, plus string | null
      userId: user.id,
      userName,
      role: isHost ? "host" : "viewer",
    });

    return NextResponse.json({
      token,
      live: {
        id: live.id,
        title: live.title,
        status: live.status,
        livekitRoomName: live.livekitRoomName,
        host: live.host,
        isFree: live.isFree,
        freeMinutes: live.freeMinutes,
        honorSeatEnabled: live.honorSeatEnabled,
        honorSeatPrice: live.honorSeatPrice,
      },
      isHost,
    });
  } catch (error) {
    console.error("[API /lives/[liveId]/join] POST error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la tentative de rejoindre le live" },
      { status: 500 },
    );
  }
}
