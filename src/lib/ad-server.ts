// src/lib/ad-server.ts
// Logique de sélection et de ciblage publicitaire

import { prisma } from "@/lib/prisma";

interface UserContext {
  id: string;
  age?: number | null;
  gender?: string | null;
  countryCode?: string | null;
  interestCodes?: string[];
  educationLevelCode?: string | null;
}

interface ServedAd {
  campaignId: string;
  creative: {
    title: string;
    body: string;
    imageUrl: string | null;
    ctaLabel: string;
    ctaUrl: string | null;
    targetProfileId: string | null;
  };
  objective: string;
  billingModel: string;
}

/**
 * Sélectionne la campagne active la plus pertinente pour un utilisateur donné.
 *
 * Algorithme :
 * 1. Récupérer toutes les campagnes actives avec budget restant
 * 2. Filtrer celles dont le ciblage correspond au profil user
 * 3. Parmi les éligibles, éviter celles vues par cet user dans la dernière heure
 * 4. Scorer par pertinence (intérêts matchés) et retourner la meilleure
 */
export async function selectAdForUser(
  userContext: UserContext,
): Promise<ServedAd | null> {
  const now = new Date();

  // 1. Campagnes actives avec budget disponible
  const activeCampaigns = await prisma.adCampaign.findMany({
    where: {
      status: "active",
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
      // Budget restant = totalBudget - amountSpent > 0
      // Prisma ne supporte pas nativement les comparaisons de champs calculés,
      // on filtre en JS après récupération (volume faible)
    },
    include: {
      creative: true,
      targeting: true,
    },
  });

  // Filtrer les campagnes avec budget restant
  const budgetedCampaigns = activeCampaigns.filter((c) => {
    const remaining = c.totalBudget - c.amountSpent;
    if (remaining <= 0) return false;
    // Vérifier le plafond journalier si défini
    if (c.dailyBudgetCap !== null) {
      // Note: pour la prod, calculer les dépenses du jour depuis AdCreditTransaction
      // Ici on laisse passer — le débit est vérifié au moment du tracking
    }
    return true;
  });

  if (budgetedCampaigns.length === 0) return null;

  // 2. Récupérer les campagnes vues par cet user dans la dernière heure
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const recentImpressions = await prisma.adImpression.findMany({
    where: {
      viewerId: userContext.id,
      createdAt: { gte: oneHourAgo },
    },
    select: { campaignId: true },
  });
  const recentCampaignIds = new Set(recentImpressions.map((i) => i.campaignId));

  // 3. Scorer les campagnes éligibles
  const scored = budgetedCampaigns
    .filter((c) => !recentCampaignIds.has(c.id)) // cooldown 1h
    .filter((c) => c.creative !== null) // doit avoir un créatif
    .map((campaign) => {
      const t = campaign.targeting;
      let score = 0;

      if (!t) return { campaign, score: 1 }; // ciblage vide = afficher à tous

      // Ciblage par genre
      if (t.genders.length > 0 && userContext.gender) {
        if (!t.genders.includes(userContext.gender)) return null; // éliminé
        score += 10;
      }

      // Ciblage par pays
      if (t.countryCodes.length > 0 && userContext.countryCode) {
        if (!t.countryCodes.includes(userContext.countryCode)) return null;
        score += 15;
      }

      // Ciblage par âge
      if (
        t.ageMin !== null &&
        userContext.age !== null &&
        userContext.age !== undefined
      ) {
        if (userContext.age < (t.ageMin ?? 0)) return null;
        score += 5;
      }
      if (
        t.ageMax !== null &&
        userContext.age !== null &&
        userContext.age !== undefined
      ) {
        if (userContext.age > (t.ageMax ?? 999)) return null;
        score += 5;
      }

      // Ciblage par niveau d'éducation
      if (t.educationLevelCodes.length > 0 && userContext.educationLevelCode) {
        if (!t.educationLevelCodes.includes(userContext.educationLevelCode))
          return null;
        score += 8;
      }

      // Ciblage par intérêts — score proportionnel aux intérêts communs
      if (t.interestCodes.length > 0 && userContext.interestCodes?.length) {
        const matchCount = userContext.interestCodes.filter((ic) =>
          t.interestCodes.includes(ic),
        ).length;
        if (matchCount === 0) return null;
        score += matchCount * 20; // fort poids aux intérêts
      }

      return { campaign, score };
    })
    .filter(Boolean) as Array<{
    campaign: (typeof budgetedCampaigns)[0];
    score: number;
  }>;

  if (scored.length === 0) return null;

  // 4. Sélectionner la meilleure campagne
  scored.sort((a, b) => b.score - a.score);
  const winner = scored[0].campaign;

  if (!winner.creative) return null;

  return {
    campaignId: winner.id,
    creative: {
      title: winner.creative.title,
      body: winner.creative.body,
      imageUrl: winner.creative.imageUrl,
      ctaLabel: winner.creative.ctaLabel,
      ctaUrl: winner.creative.ctaUrl,
      targetProfileId: winner.creative.targetProfileId,
    },
    objective: winner.objective,
    billingModel: winner.billingModel,
  };
}

/**
 * Construit le UserContext à partir du profil Prisma d'un utilisateur.
 * Appelé dans l'endpoint /api/ads/serve avant selectAdForUser.
 */
export async function buildUserContext(userId: string): Promise<UserContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profil: {
        include: {
          interests: { include: { interest: true } },
        },
      },
    },
  });

  if (!user || !user.profil) {
    return { id: userId };
  }

  const profil = user.profil;

  // Calcul de l'âge à partir de la date de naissance
  let age: number | null = null;
  if (profil.birthdate) {
    const today = new Date();
    const birth = new Date(profil.birthdate);
    age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
  }

  const interestCodes = profil.interests.map((pi) =>
    pi.interest.name.toLowerCase(),
  );

  return {
    id: userId,
    age,
    gender: profil.gender ?? null,
    countryCode: profil.countryResidenceCode ?? null,
    interestCodes,
    educationLevelCode: profil.educationLevel ?? null,
  };
}

/**
 * Vérifie si l'annonceur est éligible pour créer une campagne.
 * Règle : org vérifiée OU user individuel VIP/PLATINUM/PRESTIGE
 */
export async function checkAdvertiserEligibility(
  userId: string,
): Promise<{ eligible: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { companyProfile: true },
  });

  if (!user) return { eligible: false, reason: "Utilisateur introuvable" };

  // Organisations vérifiées
  if (user.companyProfile?.status === "VERIFIED") {
    return { eligible: true };
  }

  // Utilisateurs individuels VIP ou PLATINUM ou PRESTIGE
  if (["VIP", "PLATINUM", "PRESTIGE"].includes(user.level)) {
    return { eligible: true };
  }

  return {
    eligible: false,
    reason:
      "Seules les organisations vérifiées et les membres VIP/Platinum/Prestige peuvent créer des campagnes.",
  };
}

/**
 * Calcule le coût d'une impression ou d'un clic selon le modèle de facturation.
 */
export function computeAdCost(
  billingModel: string,
  cpmRate: number,
  cpcRate: number,
  event: "impression" | "click",
): number {
  if (event === "impression" && billingModel === "CPM") {
    return cpmRate / 1000; // coût par impression unitaire
  }
  if (event === "click" && billingModel === "CPC") {
    return cpcRate;
  }
  // Modèle non applicable pour cet événement → gratuit
  return 0;
}
