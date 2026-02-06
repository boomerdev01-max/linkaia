// src/lib/matching.ts
import { prisma } from "./prisma";

// ============================================
// TYPES
// ============================================
interface MatchResult {
  userId: string;
  nom: string;
  prenom: string;
  pseudo: string | null;
  level: string;
  photo: string | null;
  score: number;
  matchedCriteria: string[];
  totalCriteria: number;
  age: number | null;
  location: string | null;
}

interface ScoreCalculation {
  score: number;
  matchedCriteria: string[];
  totalCriteria: number;
}

// ============================================
// CONSTANTES
// ============================================
const SCORE_WEIGHTS = {
  gender: 15,
  sexualOrientation: 10,
  age: 10,
  location: 15,
  nationality: 10,
  religion: 8,
  educationLevel: 7,
  interests: 15,
} as const;

const SUBSCRIPTION_LIMITS = {
  free: {
    minScore: 20,
    maxScore: 50,
    dailyLimit: 10,
  },
  premium: {
    minScore: 20,
    maxScore: 90,
    dailyLimit: 50,
  },
  vip: {
    minScore: 20,
    maxScore: 90,
    dailyLimit: 50,
  },
  platinum: {  
    minScore: 20,
    maxScore: 100,
    dailyLimit: null,
  },
  platinium: {  // ✅ GARDE AUSSI "platinium" pour compatibilité
    minScore: 20,
    maxScore: 100,
    dailyLimit: null,
  },
  prestige: {
    minScore: 20,
    maxScore: 100,
    dailyLimit: null,
  },
} as const;

// ============================================
// FONCTION PRINCIPALE : Suggestions de profils
// ============================================
export async function getSuggestedProfiles(
  userId: string,
  userLevel: string,
  limit: number = 20,
): Promise<MatchResult[]> {
  try {
    console.log('🔍 [MATCHING] Début getSuggestedProfiles', { 
      userId, 
      userLevel, 
      limit,
      timestamp: new Date().toISOString() 
    });

    // 1. Récupérer l'utilisateur connecté avec profil + préférences
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profil: {
          include: {
            nationalites: {
              include: { nationality: true },
            },
            interests: {
              include: { interest: true },
            },
          },
        },
        preference: {
          include: {
            selectedInterests: {
              include: { interest: true },
            },
            selectedNationalities: {
              include: { nationality: true },
            },
            selectedCities: {
              include: { city: true },
            },
          },
        },
      },
    });

    console.log('👤 [MATCHING] Current user:', {
      found: !!currentUser,
      hasProfil: !!currentUser?.profil,
      hasPreference: !!currentUser?.preference,
      userLevel: currentUser?.level,
    });

    if (!currentUser) {
      console.log('❌ [MATCHING] Utilisateur non trouvé');
      return [];
    }

    if (!currentUser.profil) {
      console.log('❌ [MATCHING] Profil incomplet - utilisateur doit compléter son profil');
      return [];
    }

    if (!currentUser.preference) {
      console.log('❌ [MATCHING] Préférences incomplètes - utilisateur doit définir ses préférences');
      return [];
    }

    const currentProfil = currentUser.profil;
    const currentPref = currentUser.preference;

    console.log('✅ [MATCHING] Utilisateur valide avec profil et préférences');

    // 2. Récupérer les candidats potentiels
    const candidates = await prisma.user.findMany({
      where: {
        id: { not: userId },
        profil: { isNot: null },
        // ⚠️ TEMPORAIREMENT COMMENTÉ POUR DEBUG
        // emailVerified: true,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        level: true,
        emailVerified: true,
        profil: {
          select: {
            pseudo: true,
            profilePhotoUrl: true,
            birthdate: true,
            location: true,
            gender: true,
            sexualOrientation: true,
            religion: true,
            educationLevel: true,
            nationalites: {
              select: {
                nationality: {
                  select: { code: true },
                },
              },
            },
            interests: {
              select: {
                interest: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
      take: 400,
    });

    console.log('📊 [MATCHING] Candidats bruts trouvés:', {
      total: candidates.length,
      withEmail: candidates.filter(c => c.emailVerified).length,
      withoutEmail: candidates.filter(c => !c.emailVerified).length,
    });

    if (candidates.length === 0) {
      console.log('❌ [MATCHING] Aucun candidat disponible dans la base');
      return [];
    }

    // 3. Calculer / récupérer les scores
    const scoredCandidatesPromises = candidates.map(async (candidate) => {
      if (!candidate.profil) return null;

      const existingScore = await getValidMatchScore(
        userId,
        candidate.id,
        currentProfil.updatedAt,
        currentPref.updatedAt,
      );

      let scoreData: ScoreCalculation;

      if (existingScore) {
        scoreData = {
          score: existingScore.score,
          matchedCriteria: (existingScore.matchedCriteria as string[]) ?? [],
          totalCriteria: existingScore.totalCriteria,
        };
      } else {
        scoreData = calculateCompatibilityScore(
          currentProfil,
          currentPref,
          candidate.profil,
        );
        // Stockage asynchrone (non bloquant)
        storeMatchScore(userId, candidate.id, scoreData).catch((err) =>
          console.error('⚠️ [MATCHING] Erreur lors du stockage du score:', err),
        );
      }

      const age = candidate.profil.birthdate
        ? new Date().getFullYear() -
          new Date(candidate.profil.birthdate).getFullYear()
        : null;

      return {
        userId: candidate.id,
        nom: candidate.nom,
        prenom: candidate.prenom,
        pseudo: candidate.profil.pseudo ?? null,
        level: candidate.level,
        photo: candidate.profil.profilePhotoUrl ?? null,
        score: scoreData.score,
        matchedCriteria: scoreData.matchedCriteria,
        totalCriteria: scoreData.totalCriteria,
        age,
        location: candidate.profil.location ?? null,
      } satisfies MatchResult;
    });

    const scoredCandidates = (
      await Promise.all(scoredCandidatesPromises)
    ).filter((item): item is MatchResult => item !== null);

    console.log('🎯 [MATCHING] Après calcul des scores:', {
      total: scoredCandidates.length,
      scoreDistribution: {
        '0-20': scoredCandidates.filter(c => c.score < 20).length,
        '20-50': scoredCandidates.filter(c => c.score >= 20 && c.score < 50).length,
        '50-90': scoredCandidates.filter(c => c.score >= 50 && c.score < 90).length,
        '90-100': scoredCandidates.filter(c => c.score >= 90).length,
      }
    });

    // 4. Appliquer les restrictions du niveau d'abonnement
    const limits =
      SUBSCRIPTION_LIMITS[userLevel as keyof typeof SUBSCRIPTION_LIMITS] ??
      SUBSCRIPTION_LIMITS.free;

    console.log('📉 [MATCHING] Limites appliquées:', {
      userLevel,
      limits,
      limitesRecuperees: SUBSCRIPTION_LIMITS[userLevel as keyof typeof SUBSCRIPTION_LIMITS] ? 'Trouvées' : 'Fallback vers free'
    });

    const filtered = scoredCandidates.filter(
      (c) =>
        c.score >= limits.minScore &&
        (limits.maxScore === null || c.score <= limits.maxScore),
    );

    console.log('🔽 [MATCHING] Après filtrage par niveau:', {
      avant: scoredCandidates.length,
      après: filtered.length,
      exclus: scoredCandidates.length - filtered.length,
    });

    // 5. Trier par score descendant + limiter le nombre
    const topMatches = filtered
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log('✅ [MATCHING] Résultats finaux:', {
      total: topMatches.length,
      topScores: topMatches.slice(0, 5).map(m => ({ score: m.score, nom: m.prenom })),
    });

    return topMatches;
  } catch (error) {
    console.error('❌ [MATCHING] Erreur dans getSuggestedProfiles:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return [];
  }
}

// ============================================
// CALCUL DE SCORE DE COMPATIBILITÉ
// ============================================
function calculateCompatibilityScore(
  userProfil: any,
  userPreference: any,
  candidateProfil: any,
): ScoreCalculation {
  let score = 0;
  let maxScore = 0;
  const matchedCriteria: string[] = [];
  let totalCriteria = 0;

  // 1. Genre
  if (
    userPreference.genderPreference &&
    userPreference.genderPreference !== "any"
  ) {
    totalCriteria++;
    maxScore += SCORE_WEIGHTS.gender;
    if (
      candidateProfil.gender === "PREFER_NOT_TO_SAY" ||
      userPreference.genderPreference === candidateProfil.gender
    ) {
      score += SCORE_WEIGHTS.gender;
      matchedCriteria.push("Genre");
    }
  }

  // 2. Orientation sexuelle
  if (
    userPreference.sexualOrientationPreference &&
    userPreference.sexualOrientationPreference !== "any"
  ) {
    totalCriteria++;
    maxScore += SCORE_WEIGHTS.sexualOrientation;
    if (
      candidateProfil.sexualOrientation === "PREFER_NOT_TO_SAY" ||
      userPreference.sexualOrientationPreference ===
        candidateProfil.sexualOrientation
    ) {
      score += SCORE_WEIGHTS.sexualOrientation;
      matchedCriteria.push("Orientation");
    }
  }

  // 3. Âge
  if (
    candidateProfil.birthdate &&
    (userPreference.ageMin || userPreference.ageMax)
  ) {
    const age =
      new Date().getFullYear() -
      new Date(candidateProfil.birthdate).getFullYear();
    totalCriteria++;
    maxScore += SCORE_WEIGHTS.age;
    if (
      (!userPreference.ageMin || age >= userPreference.ageMin) &&
      (!userPreference.ageMax || age <= userPreference.ageMax)
    ) {
      score += SCORE_WEIGHTS.age;
      matchedCriteria.push("Âge");
    }
  }

  // 4. Localisation
  if (
    userPreference.locationPreference &&
    userPreference.locationPreference !== "any" &&
    userPreference.selectedCities?.length > 0
  ) {
    totalCriteria++;
    maxScore += SCORE_WEIGHTS.location;
    const preferredLocations = userPreference.selectedCities.map(
      (c: any) => c.city.displayName,
    );
    if (
      candidateProfil.location &&
      preferredLocations.includes(candidateProfil.location)
    ) {
      score += SCORE_WEIGHTS.location;
      matchedCriteria.push("Localisation");
    }
  }

  // 5. Nationalité
  if (
    userPreference.countryOriginPreference &&
    userPreference.countryOriginPreference !== "any" &&
    userPreference.selectedNationalities?.length > 0
  ) {
    totalCriteria++;
    maxScore += SCORE_WEIGHTS.nationality;
    const preferredCodes = userPreference.selectedNationalities.map(
      (n: any) => n.nationality.code,
    );
    const candidateCodes =
      candidateProfil.nationalites?.map((n: any) => n.nationality.code) ?? [];
    if (candidateCodes.some((code: string) => preferredCodes.includes(code))) {
      score += SCORE_WEIGHTS.nationality;
      matchedCriteria.push("Nationalité");
    }
  }

  // 6. Religion
  if (
    userPreference.religionPreference &&
    userPreference.religionPreference !== "any"
  ) {
    totalCriteria++;
    maxScore += SCORE_WEIGHTS.religion;
    if (
      candidateProfil.religion === "PREFER_NOT_TO_SAY" ||
      userPreference.religionPreference === candidateProfil.religion
    ) {
      score += SCORE_WEIGHTS.religion;
      matchedCriteria.push("Religion");
    }
  }

  // 7. Niveau d'éducation
  if (
    userPreference.educationLevelPreference &&
    userPreference.educationLevelPreference !== "any"
  ) {
    totalCriteria++;
    maxScore += SCORE_WEIGHTS.educationLevel;
    if (
      candidateProfil.educationLevel === "PREFER_NOT_TO_SAY" ||
      userPreference.educationLevelPreference === candidateProfil.educationLevel
    ) {
      score += SCORE_WEIGHTS.educationLevel;
      matchedCriteria.push("Éducation");
    }
  }

  // 8. Centres d'intérêt
  if (
    userPreference.interestsPreference &&
    userPreference.interestsPreference !== "any" &&
    userPreference.selectedInterests?.length > 0
  ) {
    totalCriteria++;
    maxScore += SCORE_WEIGHTS.interests;
    const preferredIds = userPreference.selectedInterests.map(
      (i: any) => i.interest.id,
    );
    const candidateIds =
      candidateProfil.interests?.map((i: any) => i.interest.id) ?? [];
    const commonCount = preferredIds.filter((id: string) =>
      candidateIds.includes(id),
    ).length;
    if (commonCount > 0) {
      score += SCORE_WEIGHTS.interests;
      matchedCriteria.push(`${commonCount} intérêt(s) commun(s)`);
    }
  }

  // Normalisation sur 100
  const normalizedScore =
    maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return {
    score: normalizedScore,
    matchedCriteria,
    totalCriteria,
  };
}

// ============================================
// GESTION DU CACHE DES SCORES
// ============================================

async function getValidMatchScore(
  userId: string,
  targetUserId: string,
  profilUpdatedAt: Date,
  preferenceUpdatedAt: Date,
) {
  try {
    const matchScore = await prisma.matchScore.findUnique({
      where: {
        userId_targetUserId: {
          userId,
          targetUserId,
        },
      },
    });

    if (!matchScore) return null;

    const lastRelevant = Math.max(
      profilUpdatedAt.getTime(),
      preferenceUpdatedAt.getTime(),
    );

    if (matchScore.lastCalculated.getTime() > lastRelevant) {
      return matchScore;
    }

    return null;
  } catch (err) {
    console.error('⚠️ [MATCHING] Erreur getValidMatchScore:', err);
    return null;
  }
}

async function storeMatchScore(
  userId: string,
  targetUserId: string,
  scoreData: ScoreCalculation,
) {
  try {
    await prisma.matchScore.upsert({
      where: {
        userId_targetUserId: { userId, targetUserId },
      },
      update: {
        score: scoreData.score,
        matchedCriteria: scoreData.matchedCriteria,
        totalCriteria: scoreData.totalCriteria,
        lastCalculated: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId,
        targetUserId,
        score: scoreData.score,
        matchedCriteria: scoreData.matchedCriteria,
        totalCriteria: scoreData.totalCriteria,
        lastCalculated: new Date(),
      },
    });
  } catch (err) {
    console.error('⚠️ [MATCHING] Erreur storeMatchScore:', err);
  }
}

// ============================================
// COMPTAGE DES MATCHS CACHÉS
// ============================================
export async function getHiddenMatchesCount(userId: string, userLevel: string) {
  // Pour l'instant on retourne 0 – implémentation complète très coûteuse
  // → à faire seulement si vraiment nécessaire et avec pagination + cache
  return { hiddenGoodMatches: 0, hiddenPerfectMatches: 0 };
}

export type { MatchResult };