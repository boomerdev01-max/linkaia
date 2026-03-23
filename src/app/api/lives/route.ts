// src/app/api/lives/route.ts
// POST /api/lives — Créer un live (host uniquement)
// GET  /api/lives — Lister les lives actifs

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { generateLiveKitToken } from "@/lib/livekit";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();

  if (!auth.authorized) {
    return NextResponse.json(auth.errorResponse, { status: auth.status });
  }

  // Protection supplémentaire : même si authorized=true, user doit exister
  if (!auth.user) {
    console.error("[API /lives] POST : authorized=true mais user absent");
    return NextResponse.json(
      { error: "Session invalide – utilisateur manquant" },
      { status: 401 }
    );
  }

  // Narrowing : TypeScript sait maintenant que user n'est pas null
  const user = auth.user;

  try {
    const body = await request.json();
    const {
      title,
      type = "live",
      isFree = true,
      ticketPriceLgems = 0,
      freeMinutes = 0,
      honorSeatEnabled = false,
      honorSeatPrice = 0,
      honorSeatDuration = 30,
    } = body;

    if (!title || title.trim().length < 3) {
      return NextResponse.json(
        { error: "Le titre du live doit contenir au moins 3 caractères" },
        { status: 400 }
      );
    }

    // Générer un nom de room unique LiveKit
    const roomName = `live_${user.id}_${Date.now()}`;

    // Créer le live en BDD
    const live = await prisma.live.create({
      data: {
        hostId: user.id,
        title: title.trim(),
        type,
        status: "waiting", // waiting → live → ended
        livekitRoomName: roomName,
        isFree,
        ticketPriceLgems: isFree ? 0 : ticketPriceLgems,
        freeMinutes,
        honorSeatEnabled,
        honorSeatPrice: honorSeatEnabled ? honorSeatPrice : 0,
        honorSeatDuration: honorSeatEnabled ? honorSeatDuration : 0,
      },
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

    // Générer le token LiveKit pour l'hôte
    const userName = user.profil?.pseudo ?? `${user.prenom} ${user.nom}`.trim();

    const token = await generateLiveKitToken({
      roomName,
      userId: user.id,
      userName,
      role: "host",
    });

    return NextResponse.json({ live, token }, { status: 201 });
  } catch (error) {
    console.error("[API /lives] POST error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création du live" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const lives = await prisma.live.findMany({
      where: { status: { in: ["waiting", "live"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        host: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            profil: { select: { pseudo: true, profilePhotoUrl: true } },
          },
        },
        _count: { select: { viewers: true } },
      },
    });

    return NextResponse.json({ lives });
  } catch (error) {
    console.error("[API /lives] GET error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des lives" },
      { status: 500 }
    );
  }
}