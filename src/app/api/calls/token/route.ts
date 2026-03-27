// app/api/calls/token/route.ts
// POST /api/calls/token
//
// Génère un token LiveKit pour rejoindre une room d'appel.
// Appelé par :
//   - L'appelant au moment d'initier l'appel (pour créer la room)
//   - L'appelé au moment d'accepter (pour rejoindre la room)
//
// Body : { sessionId: string; callType: "audio" | "video" }
// Response : { token: string; livekitUrl: string; roomName: string }

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { generateCallToken, getLiveKitPublicUrl } from "@/lib/livekit";

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────
  const auth = await requireAuth();
  if (!auth.authorized || !auth.user) {
    return NextResponse.json(auth.errorResponse, { status: auth.status });
  }
  const user = auth.user;

  try {
    const body = await request.json();
    const { sessionId, conversationId } = body as {
      sessionId: string;
      conversationId: string;
    };

    if (!sessionId || !conversationId) {
      return NextResponse.json(
        { error: "sessionId et conversationId sont requis" },
        { status: 400 },
      );
    }

    // ── Vérifier que l'utilisateur est bien participant à la conversation ──
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: user.id },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Accès refusé à cette conversation" },
        { status: 403 },
      );
    }

    // ── Générer le token ─────────────────────────────────────────────────
    const userName = user.profil?.pseudo ?? `${user.prenom} ${user.nom}`.trim();

    // Le roomName est le sessionId passé par le client
    // Format : call_{conversationId}_{timestamp}
    const token = await generateCallToken({
      roomName: sessionId,
      userId: user.id,
      userName,
    });

    const livekitUrl = getLiveKitPublicUrl();

    return NextResponse.json({ token, livekitUrl, roomName: sessionId });
  } catch (error) {
    console.error("[API /calls/token] POST error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la génération du token" },
      { status: 500 },
    );
  }
}
