// src/app/api/lives/[liveId]/route.ts
// GET  /api/lives/[liveId] — Détails du live (public)
// PATCH /api/lives/[liveId] — Démarrer ou terminer (host seulement)

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ liveId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
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
        _count: { select: { viewers: true } },
      },
    });

    if (!live) {
      return NextResponse.json({ error: "Live introuvable" }, { status: 404 });
    }

    return NextResponse.json({ live });
  } catch (error) {
    console.error("[Lives/:id] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth();

  if (!auth.authorized) {
    return NextResponse.json(auth.errorResponse, { status: auth.status });
  }

  // Protection contre le cas où authorized=true mais user est absent
  if (!auth.user) {
    console.error("[API /lives/[liveId]] authorized=true mais user absent");
    return NextResponse.json(
      { error: "Session invalide – utilisateur manquant" },
      { status: 401 },
    );
  }

  // Narrowing : TypeScript sait maintenant que user n'est pas null
  const user = auth.user;
  const { liveId } = await params;

  try {
    const live = await prisma.live.findUnique({ where: { id: liveId } });

    if (!live) {
      return NextResponse.json({ error: "Live introuvable" }, { status: 404 });
    }

    if (live.hostId !== user.id) {
      return NextResponse.json(
        { error: "Accès refusé – vous n'êtes pas l'hôte" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { action } = body; // "start" | "end"

    if (action === "start") {
      const updated = await prisma.live.update({
        where: { id: liveId },
        data: {
          status: "live",
          startedAt: new Date(),
        },
      });
      return NextResponse.json({ live: updated });
    }

    if (action === "end") {
      const updated = await prisma.live.update({
        where: { id: liveId },
        data: {
          status: "ended",
          endedAt: new Date(),
        },
      });
      return NextResponse.json({ live: updated });
    }

    return NextResponse.json(
      { error: "Action invalide (start ou end attendu)" },
      { status: 400 },
    );
  } catch (error) {
    console.error("[API /lives/[liveId]] PATCH error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la mise à jour du live" },
      { status: 500 },
    );
  }
}
