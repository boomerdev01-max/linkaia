// src/lib/behavioral-tracking.ts
import { prisma } from "@/lib/prisma";

// Types d'événements supportés
export type EventType =
  | "post_view"
  | "post_reaction"
  | "post_comment"
  | "profile_view"
  | "profile_like"
  | "story_view";

interface TrackEventParams {
  userId: string;
  eventType: EventType;
  targetId?: string;
  targetType?: "post" | "profile" | "story";
  categoryCode?: string; // fourni directement si connu
  postId?: string; // pour résoudre la catégorie si pas connue
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
}

// ============================================
// POIDS DES ÉVÉNEMENTS pour le score d'affinité
// ============================================
const EVENT_WEIGHTS: Record<EventType, number> = {
  post_view: 1,
  post_reaction: 3,
  post_comment: 5,
  profile_view: 2,
  profile_like: 4,
  story_view: 1,
};

// ============================================
// FONCTION PRINCIPALE — fire & forget
// À appeler sans await dans les routes
// ============================================
export function trackEvent(params: TrackEventParams): void {
  // Non-bloquant : on lance et on oublie
  _trackEventAsync(params).catch((err) =>
    console.error("⚠️ [TRACKING] Erreur silencieuse:", err),
  );
}

async function _trackEventAsync(params: TrackEventParams): Promise<void> {
  const {
    userId,
    eventType,
    targetId,
    targetType,
    categoryCode: providedCategoryCode,
    postId,
    durationSeconds,
    metadata,
  } = params;

  // Résoudre le code catégorie si pas fourni directement
  let categoryCode = providedCategoryCode ?? null;

  if (!categoryCode && (postId || (targetType === "post" && targetId))) {
    const resolvedPostId = postId ?? targetId!;
    const post = await prisma.post.findUnique({
      where: { id: resolvedPostId },
      select: { category: { select: { code: true } } },
    });
    categoryCode = post?.category?.code ?? null;
  }

  // 1. Enregistrer l'événement brut
  await prisma.userEvent.create({
    data: {
      userId,
      eventType,
      targetId: targetId ?? null,
      targetType: targetType ?? null,
      categoryCode,
      durationSeconds: durationSeconds ?? null,
      metadata: metadata ? (metadata as any) : undefined,
    },
  });

  // 2. Mettre à jour UserContentAffinity si on a une catégorie
  if (categoryCode) {
    await updateAffinity(userId, categoryCode, eventType);
  }
}

// ============================================
// MISE À JOUR DU SCORE D'AFFINITÉ
// ============================================
async function updateAffinity(
  userId: string,
  categoryCode: string,
  eventType: EventType,
): Promise<void> {
  const weight = EVENT_WEIGHTS[eventType] ?? 1;

  // Récupérer ou créer l'entrée d'affinité
  const existing = await prisma.userContentAffinity.findUnique({
    where: { userId_categoryCode: { userId, categoryCode } },
  });

  // Incrémenter les compteurs selon le type d'événement
  const viewIncrement = eventType === "post_view" ? 1 : 0;
  const reactionIncrement = eventType === "post_reaction" ? 1 : 0;
  const commentIncrement = eventType === "post_comment" ? 1 : 0;

  if (existing) {
    const newView = existing.viewCount + viewIncrement;
    const newReaction = existing.reactionCount + reactionIncrement;
    const newComment = existing.commentCount + commentIncrement;

    // Score = somme pondérée normalisée sur 100 (cap à 100)
    const rawScore =
      newView * EVENT_WEIGHTS.post_view +
      newReaction * EVENT_WEIGHTS.post_reaction +
      newComment * EVENT_WEIGHTS.post_comment;

    // Normalisation douce : log pour éviter la saturation rapide
    const affinityScore = Math.min(100, Math.round(Math.log1p(rawScore) * 15));

    await prisma.userContentAffinity.update({
      where: { userId_categoryCode: { userId, categoryCode } },
      data: {
        viewCount: newView,
        reactionCount: newReaction,
        commentCount: newComment,
        affinityScore,
        lastUpdated: new Date(),
      },
    });
  } else {
    // Première interaction avec cette catégorie
    const affinityScore = Math.min(100, Math.round(Math.log1p(weight) * 15));

    await prisma.userContentAffinity.create({
      data: {
        userId,
        categoryCode,
        viewCount: viewIncrement,
        reactionCount: reactionIncrement,
        commentCount: commentIncrement,
        affinityScore,
        lastUpdated: new Date(),
      },
    });
  }
}
