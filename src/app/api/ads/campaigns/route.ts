// src/app/api/ads/campaigns/route.ts
// Liste les campagnes de l'annonceur connecté + création d'une nouvelle

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { checkAdvertiserEligibility } from "@/lib/ad-server";

// ── GET — Liste des campagnes de l'annonceur ─────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (!user || error) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const campaigns = await prisma.adCampaign.findMany({
      where: { advertiserId: user.id },
      include: {
        creative: true,
        targeting: true,
        _count: { select: { impressions: true, clicks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, campaigns });
  } catch (err) {
    console.error("❌ GET /api/ads/campaigns:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── POST — Création d'une campagne (étape 1 : paramètres de base) ─────────────
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (!user || error) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier l'éligibilité de l'annonceur
    const { eligible, reason } = await checkAdvertiserEligibility(user.id);
    if (!eligible) {
      return NextResponse.json({ error: reason }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      objective,
      billingModel,
      totalBudget,
      dailyBudgetCap,
      startDate,
      endDate,
      // Créatif
      creative,
      // Ciblage
      targeting,
    } = body as {
      name: string;
      objective: string;
      billingModel: string;
      totalBudget: number;
      dailyBudgetCap?: number;
      startDate: string;
      endDate?: string;
      creative: {
        title: string;
        body: string;
        imageUrl?: string;
        ctaLabel: string;
        ctaUrl?: string;
        targetProfileId?: string;
      };
      targeting: {
        interestCodes?: string[];
        countryCodes?: string[];
        ageMin?: number;
        ageMax?: number;
        genders?: string[];
        educationLevelCodes?: string[];
      };
    };

    // Validations
    if (!name?.trim()) {
      return NextResponse.json({ error: "Le nom de la campagne est requis" }, { status: 400 });
    }
    if (!["profile_visit", "external_url"].includes(objective)) {
      return NextResponse.json({ error: "Objectif invalide" }, { status: 400 });
    }
    if (!["CPM", "CPC"].includes(billingModel)) {
      return NextResponse.json({ error: "Modèle de facturation invalide" }, { status: 400 });
    }
    if (!totalBudget || totalBudget < 5) {
      return NextResponse.json({ error: "Budget minimum : 5€" }, { status: 400 });
    }
    if (!startDate) {
      return NextResponse.json({ error: "La date de début est requise" }, { status: 400 });
    }
    if (!creative?.title?.trim() || !creative?.ctaLabel?.trim()) {
      return NextResponse.json({ error: "Le créatif (titre + CTA) est requis" }, { status: 400 });
    }
    if (objective === "external_url" && !creative?.ctaUrl) {
      return NextResponse.json(
        { error: "Une URL de destination est requise pour cet objectif" },
        { status: 400 },
      );
    }
    if (objective === "profile_visit" && !creative?.targetProfileId) {
      return NextResponse.json(
        { error: "Un profil cible est requis pour cet objectif" },
        { status: 400 },
      );
    }

    // Créer la campagne avec créatif et ciblage en transaction
    const campaign = await prisma.$transaction(async (tx) => {
      const newCampaign = await tx.adCampaign.create({
        data: {
          advertiserId: user.id,
          name: name.trim(),
          objective,
          billingModel,
          // Tarifs par défaut (configurables admin plus tard)
          cpmRate: billingModel === "CPM" ? 0.5 : 0,
          cpcRate: billingModel === "CPC" ? 0.1 : 0,
          totalBudget,
          dailyBudgetCap: dailyBudgetCap ?? null,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          status: "pending", // → admin doit valider
        },
      });

      // Créatif
      await tx.adCreative.create({
        data: {
          campaignId: newCampaign.id,
          title: creative.title.trim(),
          body: creative.body?.trim() ?? "",
          imageUrl: creative.imageUrl ?? null,
          ctaLabel: creative.ctaLabel.trim(),
          ctaUrl: creative.ctaUrl ?? null,
          targetProfileId: creative.targetProfileId ?? null,
        },
      });

      // Ciblage
      await tx.adTargeting.create({
        data: {
          campaignId: newCampaign.id,
          interestCodes: targeting?.interestCodes ?? [],
          countryCodes: targeting?.countryCodes ?? [],
          ageMin: targeting?.ageMin ?? null,
          ageMax: targeting?.ageMax ?? null,
          genders: targeting?.genders ?? [],
          educationLevelCodes: targeting?.educationLevelCodes ?? [],
        },
      });

      return newCampaign;
    });

    return NextResponse.json(
      { success: true, campaign },
      { status: 201 },
    );
  } catch (err) {
    console.error("❌ POST /api/ads/campaigns:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}