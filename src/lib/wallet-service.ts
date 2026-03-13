// src/lib/wallet-service.ts
// ─────────────────────────────────────────────────────────────────────────────
// Service centralisé pour TOUTES les opérations de wallet.
// Principe : toute mutation passe par ici, jamais directement depuis les routes.
// Les opérations financières utilisent prisma.$transaction() pour l'atomicité.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";

// Commission prélevée par Linkaïa sur les cadeaux reçus
// Le créateur reçoit 70% en Diamonds, la plateforme garde 30%
export const PLATFORM_FEE_RATE = 0.3;
export const CREATOR_SHARE_RATE = 0.7;

// ─────────────────────────────────────────────────────────────────────────────
// INITIALISATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne le wallet d'un utilisateur, ou le crée s'il n'existe pas.
 * À appeler lors de la première visite du wallet ou de la création du compte.
 */
export async function getOrCreateWallet(userId: string) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, lgemsBalance: 0, diamondsBalance: 0 },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CRÉDIT L-GEMS (appelé par le webhook Stripe uniquement)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crédite des L-Gems suite à un achat Stripe confirmé.
 *
 * Cette fonction est UNIQUEMENT appelée depuis le webhook Stripe
 * (event: payment_intent.succeeded) — jamais directement depuis une API route.
 *
 * Idempotence : si le webhook est reçu 2x pour le même PaymentIntent,
 * la transaction avec @unique stripePaymentIntentId lèvera une erreur
 * Prisma P2002 qu'on catch pour éviter le double-crédit.
 */
export async function creditLGemsFromPurchase(params: {
  userId: string;
  lgemsAmount: number;
  stripePaymentIntentId: string;
  packCode: string;
}): Promise<{ success: boolean; alreadyProcessed?: boolean }> {
  const { userId, lgemsAmount, stripePaymentIntentId, packCode } = params;

  try {
    await prisma.$transaction(async (tx) => {
      // Créer ou mettre à jour le wallet
      const wallet = await tx.wallet.upsert({
        where: { userId },
        update: { lgemsBalance: { increment: lgemsAmount } },
        create: { userId, lgemsBalance: lgemsAmount, diamondsBalance: 0 },
      });

      // Recalculer le solde avant pour le snapshot d'audit
      // (wallet.lgemsBalance est déjà la valeur APRÈS le update/create)
      const balanceBefore = wallet.lgemsBalance - lgemsAmount;

      // Créer la transaction — @unique stripePaymentIntentId garantit l'idempotence
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "purchase",
          amount: lgemsAmount,
          currency: "LGEMS",
          balanceBefore,
          balanceAfter: wallet.lgemsBalance,
          stripePaymentIntentId,
          referenceType: "pack",
          referenceId: packCode,
          metadata: { packCode, source: "stripe_webhook" },
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    // Code P2002 = violation de contrainte unique (double-crédit)
    if (
      error?.code === "P2002" &&
      error?.meta?.target?.includes("stripe_payment_intent_id")
    ) {
      console.log(
        `[Wallet] Idempotence : PaymentIntent déjà traité ${stripePaymentIntentId}`,
      );
      return { success: true, alreadyProcessed: true };
    }
    console.error("[Wallet] creditLGemsFromPurchase error:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENVOI DE CADEAU
// ─────────────────────────────────────────────────────────────────────────────

export interface SendGiftParams {
  senderId: string;
  receiverId: string;
  giftId: string;
  quantity?: number;
  liveId?: string;
  postId?: string;
  message?: string;
}

export interface SendGiftResult {
  success: boolean;
  sentGift?: {
    id: string;
    lgemsAmount: number;
    diamondsAwarded: number;
    impactAmount: number;
    giftName: string;
    giftEmoji: string;
  };
  error?: string;
}

/**
 * Transaction atomique d'envoi de cadeau.
 *
 * Opérations enchaînées (tout réussit ou tout échoue) :
 * 1. Vérifier solde sender suffisant
 * 2. Débiter wallet sender (-lgemsAmount en LGEMS)
 * 3. Créditer wallet receiver (+diamondsAwarded en DIAMONDS)
 * 4. Calculer montant ONG si cadeau à impact
 * 5. Créer SentGift
 * 6. Créer 2 WalletTransactions (GIFT_SENT + GIFT_RECEIVED)
 * 7. Mettre à jour CreatorScore du receiver
 * 8. Mettre à jour stats du Live si applicable
 */
export async function sendGift(
  params: SendGiftParams,
): Promise<SendGiftResult> {
  const {
    senderId,
    receiverId,
    giftId,
    quantity = 1,
    liveId,
    postId,
    message,
  } = params;

  if (senderId === receiverId) {
    return {
      success: false,
      error: "Vous ne pouvez pas vous envoyer un cadeau",
    };
  }
  if (quantity < 1 || quantity > 100) {
    return { success: false, error: "Quantité invalide (1-100)" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Charger le cadeau
      const gift = await tx.virtualGift.findUnique({ where: { id: giftId } });
      if (!gift || !gift.isActive)
        throw new Error("Cadeau introuvable ou inactif");

      const totalLgems = gift.lgemsValue * quantity;

      // 2. Vérifier et débiter le sender
      const senderWallet = await tx.wallet.upsert({
        where: { userId: senderId },
        update: {},
        create: { userId: senderId, lgemsBalance: 0, diamondsBalance: 0 },
      });

      if (senderWallet.lgemsBalance < totalLgems) {
        throw new Error(
          `Solde insuffisant : ${senderWallet.lgemsBalance} L-Gems disponibles, ${totalLgems} requis`,
        );
      }

      const updatedSenderWallet = await tx.wallet.update({
        where: { userId: senderId },
        data: { lgemsBalance: { decrement: totalLgems } },
      });

      // 3. Calculer et créditer le receiver (70% en Diamonds)
      const diamondsAwarded = totalLgems * CREATOR_SHARE_RATE;

      const receiverWalletBefore = await tx.wallet.upsert({
        where: { userId: receiverId },
        update: {},
        create: { userId: receiverId, lgemsBalance: 0, diamondsBalance: 0 },
      });

      const updatedReceiverWallet = await tx.wallet.update({
        where: { userId: receiverId },
        data: { diamondsBalance: { increment: diamondsAwarded } },
      });

      // 4. Impact ONG
      const impactAmount = gift.isImpactGift
        ? totalLgems * gift.impactPercent
        : 0;

      // 5. Créer SentGift
      const sentGift = await tx.sentGift.create({
        data: {
          senderId,
          receiverId,
          giftId,
          quantity,
          lgemsAmount: totalLgems,
          diamondsAwarded,
          liveId: liveId ?? null,
          postId: postId ?? null,
          impactAmount,
          message: message ?? null,
        },
      });

      // 6a. WalletTransaction sender
      await tx.walletTransaction.create({
        data: {
          walletId: senderWallet.id,
          type: "gift_sent",
          amount: -totalLgems,
          currency: "LGEMS",
          balanceBefore: senderWallet.lgemsBalance,
          balanceAfter: updatedSenderWallet.lgemsBalance,
          referenceId: sentGift.id,
          referenceType: "gift",
          metadata: {
            giftCode: gift.code,
            giftName: gift.name,
            receiverId,
            quantity,
          },
        },
      });

      // 6b. WalletTransaction receiver (en Diamonds)
      await tx.walletTransaction.create({
        data: {
          walletId: updatedReceiverWallet.id,
          type: "gift_received",
          amount: Math.floor(diamondsAwarded),
          amountFloat: diamondsAwarded,
          currency: "DIAMONDS",
          balanceBefore: Math.floor(receiverWalletBefore.diamondsBalance),
          balanceAfter: Math.floor(updatedReceiverWallet.diamondsBalance),
          referenceId: sentGift.id,
          referenceType: "gift",
          metadata: {
            giftCode: gift.code,
            senderId,
            platformFee: totalLgems * PLATFORM_FEE_RATE,
          },
        },
      });

      // 7. Mettre à jour CreatorScore
      await tx.creatorScore.upsert({
        where: { userId: receiverId },
        update: {
          totalLgemsEarned: { increment: totalLgems },
          totalDiamondsEarned: { increment: diamondsAwarded },
          totalImpactGenerated: { increment: impactAmount },
        },
        create: {
          userId: receiverId,
          totalLgemsEarned: totalLgems,
          totalDiamondsEarned: diamondsAwarded,
          totalImpactGenerated: impactAmount,
        },
      });

      // 8. Stats Live
      if (liveId) {
        await tx.live.update({
          where: { id: liveId },
          data: { totalGiftsLgems: { increment: totalLgems } },
        });
      }

      return {
        id: sentGift.id,
        lgemsAmount: totalLgems,
        diamondsAwarded,
        impactAmount,
        giftName: gift.name,
        giftEmoji: gift.emoji,
      };
    });

    return { success: true, sentGift: result };
  } catch (error: any) {
    console.error("[Wallet] sendGift error:", error);
    return {
      success: false,
      error: error.message ?? "Erreur lors de l'envoi du cadeau",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTURE
// ─────────────────────────────────────────────────────────────────────────────

export async function getWalletBalance(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { lgemsBalance: true, diamondsBalance: true, updatedAt: true },
  });
  return (
    wallet ?? { lgemsBalance: 0, diamondsBalance: 0, updatedAt: new Date() }
  );
}

export async function getWalletTransactions(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    type?: string;
    currency?: string;
  } = {},
) {
  const { page = 1, limit = 20, type, currency } = options;
  const skip = (page - 1) * limit;

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!wallet)
    return { transactions: [], total: 0, page, limit, totalPages: 0 };

  const where = {
    walletId: wallet.id,
    ...(type ? { type } : {}),
    ...(currency ? { currency } : {}),
  };

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return {
    transactions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
