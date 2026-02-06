// src/lib/notification-helpers.ts
import { prisma } from "@/lib/prisma";

/**
 * 📢 Types de notifications disponibles dans l'application
 */
export const NOTIFICATION_TYPES = {
  // Messages
  NEW_MESSAGE: "new_message",

  // Profil
  PROFILE_VISIT: "profile_visit",
  PROFILE_LIKE: "profile_like",

  // Posts
  POST_REACTION: "post_reaction",
  POST_COMMENT: "post_comment",

  // Commentaires
  COMMENT_REACTION: "comment_reaction",
  COMMENT_REPLY: "comment_reply",

  // Matchs
  NEW_MATCH: "new_match",
  HIGH_MATCH: "high_match", // 80%+
  PERFECT_MATCH: "perfect_match", // 90%+

  // Abonnements
  SUBSCRIPTION_ACTIVATED: "subscription_activated",
  SUBSCRIPTION_EXPIRED: "subscription_expired",
  SUBSCRIPTION_EXPIRING_SOON: "subscription_expiring_soon",

  // Amitiés
  FRIENDSHIP_REQUEST: "friendship_request",
  FRIENDSHIP_ACCEPTED: "friendship_accepted",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/**
 * 🎨 Configuration visuelle des notifications
 */
export const NOTIFICATION_CONFIG = {
  [NOTIFICATION_TYPES.NEW_MESSAGE]: {
    icon: "MessageCircle",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  [NOTIFICATION_TYPES.PROFILE_VISIT]: {
    icon: "Eye",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  [NOTIFICATION_TYPES.PROFILE_LIKE]: {
    icon: "Heart",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  [NOTIFICATION_TYPES.POST_REACTION]: {
    icon: "ThumbsUp",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  [NOTIFICATION_TYPES.POST_COMMENT]: {
    icon: "MessageSquare",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  [NOTIFICATION_TYPES.COMMENT_REACTION]: {
    icon: "ThumbsUp",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  [NOTIFICATION_TYPES.COMMENT_REPLY]: {
    icon: "Reply",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  [NOTIFICATION_TYPES.NEW_MATCH]: {
    icon: "Heart",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  [NOTIFICATION_TYPES.HIGH_MATCH]: {
    icon: "Sparkles",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  [NOTIFICATION_TYPES.PERFECT_MATCH]: {
    icon: "Star",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  [NOTIFICATION_TYPES.SUBSCRIPTION_ACTIVATED]: {
    icon: "CreditCard",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  [NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED]: {
    icon: "CreditCard",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  [NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING_SOON]: {
    icon: "AlertCircle",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  [NOTIFICATION_TYPES.FRIENDSHIP_REQUEST]: {
    icon: "UserPlus",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  [NOTIFICATION_TYPES.FRIENDSHIP_ACCEPTED]: {
    icon: "UserCheck",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
};

/**
 * ⏱️ Délai de regroupement des notifications (en minutes)
 */
const GROUPING_DELAY_MINUTES = 5;

/**
 * 📝 Interface pour créer une notification
 */
interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * ✅ Crée une notification (avec gestion du regroupement intelligent)
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, metadata = {} } = params;

  try {
    // Vérifier si on doit regrouper (pour les likes de posts)
    if (type === NOTIFICATION_TYPES.POST_REACTION && metadata.actorId) {
      const recentNotification = await findRecentGroupableNotification(
        userId,
        type,
        metadata.actorId,
      );

      if (recentNotification) {
        // Mettre à jour la notification existante
        return await updateGroupedNotification(
          recentNotification,
          metadata.postId,
        );
      }
    }

    // Créer une nouvelle notification
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: metadata as any,
      },
    });
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    throw error;
  }
}

/**
 * 🔍 Trouve une notification récente qui peut être regroupée
 */
async function findRecentGroupableNotification(
  userId: string,
  type: NotificationType,
  actorId: string,
) {
  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - GROUPING_DELAY_MINUTES);

  return await prisma.notification.findFirst({
    where: {
      userId,
      type,
      createdAt: { gte: cutoffTime },
      metadata: {
        path: ["actorId"],
        equals: actorId,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * 🔄 Met à jour une notification groupée
 */
async function updateGroupedNotification(notification: any, newPostId: string) {
  const metadata = notification.metadata as any;
  const likedPosts = metadata.likedPosts || [metadata.postId];

  if (!likedPosts.includes(newPostId)) {
    likedPosts.push(newPostId);
  }

  const count = likedPosts.length;
  const actorName = metadata.actorName || "Un utilisateur";

  return await prisma.notification.update({
    where: { id: notification.id },
    data: {
      message: `${actorName} a aimé ${count} de vos publications`,
      metadata: {
        ...metadata,
        likedPosts,
        count,
      } as any,
      isRead: false, // Remettre en non lu
    },
  });
}

/**
 * 👁️ Enregistre une visite de profil (uniquement la première fois)
 */
export async function trackProfileVisit(visitorId: string, profileId: string) {
  // Ne pas créer de notification si l'utilisateur visite son propre profil
  if (visitorId === profileId) {
    return null;
  }

  try {
    // Vérifier si une notification de visite existe déjà
    const existingVisit = await prisma.notification.findFirst({
      where: {
        userId: profileId,
        type: NOTIFICATION_TYPES.PROFILE_VISIT,
        metadata: {
          path: ["visitorId"],
          equals: visitorId,
        },
      },
    });

    if (existingVisit) {
      // Déjà notifié, ne rien faire
      return null;
    }

    // Récupérer les infos du visiteur
    const visitor = await prisma.user.findUnique({
      where: { id: visitorId },
      select: {
        id: true,
        prenom: true,
        nom: true,
        profil: {
          select: {
            pseudo: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    if (!visitor) {
      return null;
    }

    const visitorName =
      visitor.profil?.pseudo || `${visitor.prenom} ${visitor.nom}`;

    // Créer la notification
    return await createNotification({
      userId: profileId,
      type: NOTIFICATION_TYPES.PROFILE_VISIT,
      title: "Visite de profil",
      message: `${visitorName} a visité votre profil`,
      metadata: {
        visitorId: visitor.id,
        visitorName,
        visitorPhoto: visitor.profil?.profilePhotoUrl,
      },
    });
  } catch (error) {
    console.error("❌ Error tracking profile visit:", error);
    return null;
  }
}

/**
 * 💖 Crée une notification de like de profil
 */
export async function notifyProfileLike(likerId: string, profileId: string) {
  try {
    const liker = await prisma.user.findUnique({
      where: { id: likerId },
      select: {
        id: true,
        prenom: true,
        nom: true,
        profil: {
          select: {
            pseudo: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    if (!liker) {
      return null;
    }

    const likerName = liker.profil?.pseudo || `${liker.prenom} ${liker.nom}`;

    return await createNotification({
      userId: profileId,
      type: NOTIFICATION_TYPES.PROFILE_LIKE,
      title: "Nouveau like !",
      message: `${likerName} a aimé votre profil`,
      metadata: {
        likerId: liker.id,
        likerName,
        likerPhoto: liker.profil?.profilePhotoUrl,
      },
    });
  } catch (error) {
    console.error("❌ Error notifying profile like:", error);
    return null;
  }
}

/**
 * 💬 Crée une notification de nouveau message
 */
export async function notifyNewMessage(
  senderId: string,
  recipientId: string,
  conversationId: string,
  messagePreview: string,
) {
  try {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: {
        id: true,
        prenom: true,
        nom: true,
        profil: {
          select: {
            pseudo: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    if (!sender) {
      return null;
    }

    const senderName =
      sender.profil?.pseudo || `${sender.prenom} ${sender.nom}`;

    return await createNotification({
      userId: recipientId,
      type: NOTIFICATION_TYPES.NEW_MESSAGE,
      title: "Nouveau message",
      message: `${senderName}: ${messagePreview}`,
      metadata: {
        senderId: sender.id,
        senderName,
        senderPhoto: sender.profil?.profilePhotoUrl,
        conversationId,
      },
    });
  } catch (error) {
    console.error("❌ Error notifying new message:", error);
    return null;
  }
}

/**
 * 🎯 Crée une notification de match
 */
export async function notifyMatch(
  userId: string,
  matchedUserId: string,
  matchScore: number,
) {
  try {
    const matchedUser = await prisma.user.findUnique({
      where: { id: matchedUserId },
      select: {
        id: true,
        prenom: true,
        nom: true,
        profil: {
          select: {
            pseudo: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    if (!matchedUser) {
      return null;
    }

    const matchedName =
      matchedUser.profil?.pseudo || `${matchedUser.prenom} ${matchedUser.nom}`;

    // Déterminer le type de notification selon le score
    let type: NotificationType;
    let title: string;
    let emoji: string;

    if (matchScore >= 90) {
      type = NOTIFICATION_TYPES.PERFECT_MATCH;
      title = "Match parfait ! 🌟";
      emoji = "🌟";
    } else if (matchScore >= 80) {
      type = NOTIFICATION_TYPES.HIGH_MATCH;
      title = "Excellent match ! ✨";
      emoji = "✨";
    } else {
      type = NOTIFICATION_TYPES.NEW_MATCH;
      title = "Nouveau match ! 💖";
      emoji = "💖";
    }

    return await createNotification({
      userId,
      type,
      title,
      message: `${emoji} Vous avez ${matchScore}% de compatibilité avec ${matchedName}`,
      metadata: {
        matchedUserId: matchedUser.id,
        matchedName,
        matchedPhoto: matchedUser.profil?.profilePhotoUrl,
        matchScore,
      },
    });
  } catch (error) {
    console.error("❌ Error notifying match:", error);
    return null;
  }
}

/**
 * 🎉 Crée une notification d'abonnement activé
 */
export async function notifySubscriptionActivated(
  userId: string,
  subscriptionName: string,
) {
  try {
    return await createNotification({
      userId,
      type: NOTIFICATION_TYPES.SUBSCRIPTION_ACTIVATED,
      title: "Abonnement activé 🎉",
      message: `Votre abonnement ${subscriptionName} a été activé avec succès !`,
      metadata: {
        subscriptionName,
      },
    });
  } catch (error) {
    console.error("❌ Error notifying subscription activated:", error);
    return null;
  }
}

/**
 * ⚠️ Crée une notification d'abonnement expiré
 */
export async function notifySubscriptionExpired(
  userId: string,
  subscriptionName: string,
) {
  try {
    return await createNotification({
      userId,
      type: NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED,
      title: "Abonnement expiré",
      message: `Votre abonnement ${subscriptionName} a expiré. Renouvelez-le pour continuer à profiter de tous les avantages.`,
      metadata: {
        subscriptionName,
      },
    });
  } catch (error) {
    console.error("❌ Error notifying subscription expired:", error);
    return null;
  }
}

/**
 * 👥 Crée une notification de demande d'amitié
 */
export async function notifyFriendshipRequest(
  requesterId: string,
  receiverId: string,
) {
  try {
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: {
        id: true,
        prenom: true,
        nom: true,
        profil: {
          select: {
            pseudo: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    if (!requester) {
      return null;
    }

    const requesterName =
      requester.profil?.pseudo || `${requester.prenom} ${requester.nom}`;

    return await createNotification({
      userId: receiverId,
      type: NOTIFICATION_TYPES.FRIENDSHIP_REQUEST,
      title: "Nouvelle demande d'amitié",
      message: `${requesterName} vous a envoyé une demande d'amitié`,
      metadata: {
        requesterId: requester.id,
        requesterName,
        requesterPhoto: requester.profil?.profilePhotoUrl,
      },
    });
  } catch (error) {
    console.error("❌ Error notifying friendship request:", error);
    return null;
  }
}

/**
 * ✅ Crée une notification d'amitié acceptée
 */
export async function notifyFriendshipAccepted(
  accepterId: string,
  requesterId: string,
) {
  try {
    const accepter = await prisma.user.findUnique({
      where: { id: accepterId },
      select: {
        id: true,
        prenom: true,
        nom: true,
        profil: {
          select: {
            pseudo: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    if (!accepter) {
      return null;
    }

    const accepterName =
      accepter.profil?.pseudo || `${accepter.prenom} ${accepter.nom}`;

    return await createNotification({
      userId: requesterId,
      type: NOTIFICATION_TYPES.FRIENDSHIP_ACCEPTED,
      title: "Demande d'amitié acceptée",
      message: `${accepterName} a accepté votre demande d'amitié`,
      metadata: {
        accepterId: accepter.id,
        accepterName,
        accepterPhoto: accepter.profil?.profilePhotoUrl,
      },
    });
  } catch (error) {
    console.error("❌ Error notifying friendship accepted:", error);
    return null;
  }
}

/**
 * 🧹 Nettoie les anciennes notifications (à appeler périodiquement)
 * Supprime les notifications lues de plus de 30 jours
 */
export async function cleanupOldNotifications() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        readAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    console.log(`🧹 Cleaned up ${result.count} old notifications`);
    return result.count;
  } catch (error) {
    console.error("❌ Error cleaning up notifications:", error);
    return 0;
  }
}
