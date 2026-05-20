// src/app/api/ads/campaigns/[id]/route.ts
// Détail d'une campagne + actions (pause, reprise, suppression)

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// ── GET — Détail complet d'une campagne ──────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { user, error } = await getAuthenticatedUser();
    if (!user || error) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const campaign = await prisma.adCampaign.findUnique({
      where: { id },
      include: {
        creative: true,
        targeting: true,
        creditTransactions: { orderBy: { createdAt: "desc" }, take: 20 },
        _count: { select: { impressions: true, clicks: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 },
      );
    }

    // L'annonceur ne peut voir que ses propres campagnes
    if (campaign.advertiserId !== user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    return NextResponse.json({ success: true, campaign });
  } catch (err) {
    console.error("❌ GET /api/ads/campaigns/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── PATCH — Mettre à jour le statut ou les paramètres d'une campagne ─────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { user, error } = await getAuthenticatedUser();
    if (!user || error) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const campaign = await prisma.adCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 },
      );
    }

    if (campaign.advertiserId !== user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body as { action: "pause" | "resume" };

    // Actions autorisées par l'annonceur
    if (action === "pause" && campaign.status === "active") {
      const updated = await prisma.adCampaign.update({
        where: { id },
        data: { status: "paused" },
      });
      return NextResponse.json({ success: true, campaign: updated });
    }

    if (action === "resume" && campaign.status === "paused") {
      const updated = await prisma.adCampaign.update({
        where: { id },
        data: { status: "active" },
      });
      return NextResponse.json({ success: true, campaign: updated });
    }

    return NextResponse.json(
      { error: "Action invalide pour ce statut" },
      { status: 400 },
    );
  } catch (err) {
    console.error("❌ PATCH /api/ads/campaigns/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── DELETE — Supprimer une campagne (uniquement si draft ou rejected) ─────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { user, error } = await getAuthenticatedUser();
    if (!user || error) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const campaign = await prisma.adCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 },
      );
    }

    if (campaign.advertiserId !== user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // On ne peut supprimer que les brouillons ou les campagnes rejetées
    if (!["draft", "rejected", "ended"].includes(campaign.status)) {
      return NextResponse.json(
        { error: "Impossible de supprimer une campagne active ou en attente" },
        { status: 400 },
      );
    }

    await prisma.adCampaign.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE /api/ads/campaigns/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
