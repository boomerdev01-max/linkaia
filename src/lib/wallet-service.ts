// src/lib/wallet-service.ts  ← VERSION CORRIGÉE
// Correction : le champ `description` n'existe pas dans WalletTransaction côté Prisma.
// On stocke les libellés dans le champ `metadata` (Json) déjà présent dans le schéma.
// Tout le reste est identique au fichier fourni.

import { prisma } from "@/lib/prisma";

export const PLATFORM_FEE_RATE = 0.3;
export const CREATOR_SHARE_RATE = 0.7;

// ─────────────────────────────────────────────────────────────────────────────
// INITIALISATION
// ─────────────────────────────────────────────────────────────────────────────

export async function getOrCreateWallet(userId: string) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, lgemsBalance: 0, diamondsBalance: 0 },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CRÉDIT L-GEMS (webhook Stripe uniquement)
// ─────────────────────────────────────────────────────────────────────────────

export async function creditLGemsFromPurchase(params: {
  userId: string;
  lgemsAmount: number;
  stripePaymentIntentId: string;
  packCode: string;
}): Promise<{ success: boolean; alreadyProcessed?: boolean }> {
  const { userId, lgemsAmount, stripePaymentIntentId, packCode } = params;

  try {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId },
        update: { lgemsBalance: { increment: lgemsAmount } },
        create: { userId, lgemsBalance: lgemsAmount, diamondsBalance: 0 },
      });

      const balanceBefore = wallet.lgemsBalance - lgemsAmount;

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
          // ✅ FIX : `description` n'existe pas dans le schéma → on met le libellé dans metadata
          metadata: {
            packCode,
            source: "stripe_webhook",
            label: `Achat pack ${packCode}`,
          },
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    if (
      error?.code === "P2002" &&
      error?.meta?.target?.includes("stripe_payment_intent_id")
    ) {
      console.log(
        `[Wallet] Idempotence : PaymentIntent déjà traité ${params.stripePaymentIntentId}`,
      );
      return { success: true, alreadyProcessed: true };
    }
    console.error("[creditLGemsFromPurchase] error:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DÉBIT WALLET
// ─────────────────────────────────────────────────────────────────────────────

export interface DebitWalletOptions {
  userId: string;
  lgemsAmount: number;
  // ✅ FIX : description devient un champ de metadata, pas une colonne directe
  description: string;
  referenceId?: string;
  referenceType?: string;
}

export async function debitWallet(
  opts: DebitWalletOptions,
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const { userId, lgemsAmount, description, referenceId, referenceType } = opts;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error("Wallet introuvable");
      if (wallet.lgemsBalance < lgemsAmount)
        throw new Error("INSUFFICIENT_FUNDS");

      const updated = await tx.wallet.update({
        where: { userId },
        data: { lgemsBalance: { decrement: lgemsAmount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "debit",
          amount: lgemsAmount,
          currency: "LGEMS",
          balanceBefore: wallet.lgemsBalance,
          balanceAfter: updated.lgemsBalance,
          referenceId: referenceId ?? null,
          referenceType: referenceType ?? null,
          // ✅ FIX : libellé dans metadata
          metadata: { label: description },
        },
      });

      return updated.lgemsBalance;
    });

    return { success: true, newBalance: result };
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_FUNDS") {
      return { success: false, error: "Solde L-Gems insuffisant" };
    }
    console.error("[debitWallet]", err);
    return { success: false, error: "Erreur serveur" };
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
    gift: any;
    id: string;
    lgemsAmount: number;
    diamondsAwarded: number;
    impactAmount: number;
    giftName: string;
    giftEmoji: string;
  };
  error?: string;
}

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

      // 2. Vérifier et débiter sender
      const senderWallet = await tx.wallet.upsert({
        where: { userId: senderId },
        update: {},
        create: { userId: senderId, lgemsBalance: 0, diamondsBalance: 0 },
      });

      if (senderWallet.lgemsBalance < totalLgems)
        throw new Error("INSUFFICIENT_FUNDS");

      const updatedSender = await tx.wallet.update({
        where: { userId: senderId },
        data: { lgemsBalance: { decrement: totalLgems } },
      });

      // 3. Créditer receiver (70%)
      const diamondsAwarded = totalLgems * CREATOR_SHARE_RATE;

      const receiverBefore = await tx.wallet.upsert({
        where: { userId: receiverId },
        update: {},
        create: { userId: receiverId, lgemsBalance: 0, diamondsBalance: 0 },
      });

      const updatedReceiver = await tx.wallet.update({
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

      // 6. Transactions wallet — ✅ FIX : libellé dans metadata, pas dans description
      await tx.walletTransaction.create({
        data: {
          walletId: senderWallet.id,
          type: "gift_sent",
          amount: -totalLgems,
          currency: "LGEMS",
          balanceBefore: senderWallet.lgemsBalance,
          balanceAfter: updatedSender.lgemsBalance,
          referenceId: sentGift.id,
          referenceType: "gift",
          metadata: {
            label: `Cadeau envoyé : ${gift.name}`,
            giftCode: gift.code,
            giftName: gift.name,
            receiverId,
            quantity,
          },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: updatedReceiver.id,
          type: "gift_received",
          amount: Math.floor(diamondsAwarded),
          currency: "DIAMONDS",
          balanceBefore: Math.floor(receiverBefore.diamondsBalance),
          balanceAfter: Math.floor(updatedReceiver.diamondsBalance),
          referenceId: sentGift.id,
          referenceType: "gift",
          metadata: {
            label: `Cadeau reçu : ${gift.name}`,
            giftCode: gift.code,
            senderId,
            platformFee: totalLgems * PLATFORM_FEE_RATE,
          },
        },
      });

      // 7. CreatorScore
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

      // 8. Stats live
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
        gift,
      };
    });

    return { success: true, sentGift: result };
  } catch (error: any) {
    console.error("[sendGift]", error);
    if (error.message === "INSUFFICIENT_FUNDS") {
      return { success: false, error: "Solde L-Gems insuffisant" };
    }
    return {
      success: false,
      error: error.message || "Erreur lors de l'envoi du cadeau",
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
