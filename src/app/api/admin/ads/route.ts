// src/app/api/admin/ads/route.ts
// Route admin pour lister et modérer les campagnes publicitaires

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { userHasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

// ── GET — Liste toutes les campagnes (avec filtres) ──────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (!user || error) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Réutilisation du pattern existant : permission "user.read" pour l'admin
    const canAccess = await userHasPermission(user.id, "user.read");
    if (!canAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [campaigns, total] = await Promise.all([
      prisma.adCampaign.findMany({
        where,
        include: {
          advertiser: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              companyProfile: { select: { companyName: true } },
            },
          },
          creative: true,
          targeting: true,
          _count: { select: { impressions: true, clicks: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.adCampaign.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("❌ GET /api/admin/ads:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── PATCH — Valider ou rejeter une campagne ───────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (!user || error) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const canModerate = await userHasPermission(user.id, "user.update");
    if (!canModerate) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { campaignId, action, rejectedReason } = body as {
      campaignId: string;
      action: "approve" | "reject";
      rejectedReason?: string;
    };

    if (!campaignId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Paramètres invalides" },
        { status: 400 },
      );
    }

    const campaign = await prisma.adCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 },
      );
    }

    if (campaign.status !== "pending") {
      return NextResponse.json(
        { error: "Seules les campagnes en attente peuvent être modérées" },
        { status: 400 },
      );
    }

    if (action === "reject" && !rejectedReason?.trim()) {
      return NextResponse.json(
        { error: "Une raison de rejet est requise" },
        { status: 400 },
      );
    }

    const updated = await prisma.adCampaign.update({
      where: { id: campaignId },
      data: {
        status: action === "approve" ? "active" : "rejected",
        rejectedReason: action === "reject" ? rejectedReason : null,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, campaign: updated });
  } catch (err) {
    console.error("❌ PATCH /api/admin/ads:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
