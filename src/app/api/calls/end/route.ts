// app/api/calls/end/route.ts
// POST /api/calls/end
//
// Termine la room LiveKit d'un appel (suppression côté serveur).
// Appelé par le dernier participant qui raccroche.
//
// Body : { sessionId: string; conversationId: string }
// Response : { success: boolean }

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { deleteRoom } from "@/lib/livekit";

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

    // ── Vérifier que l'utilisateur est bien participant ──────────────────
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: user.id },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Accès refusé à cette conversation" },
        { status: 403 },
      );
    }

    // ── Supprimer la room LiveKit ─────────────────────────────────────────
    // deleteRoom est tolérant aux erreurs (room déjà vide = pas bloquant)
    await deleteRoom(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /calls/end] POST error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la clôture de l'appel" },
      { status: 500 },
    );
  }
}
