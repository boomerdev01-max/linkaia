// src/lib/admin-notification-helpers.ts
// Extension de notification-helpers.ts pour les notifications admin
// Utilise la même table Notification avec metadata { adminOnly: true }

import { prisma } from "@/lib/prisma";

/**
 * 📢 Types de notifications ADMIN
 * On réutilise les types existants + adminOnly: true dans metadata
 */
export const ADMIN_NOTIFICATION_TYPES = {
  NEW_USER: "new_user", // Nouvel utilisateur inscrit
  NEW_ADMIN_USER: "new_admin_user", // Nouvel admin créé par l'admin
  NEW_REPORT: "friendship_request", // Réutilisation — remplacé par type dédié ci-dessous
  REPORT_SUBMITTED: "report_submitted", // Nouveau signalement
  NEW_SUBSCRIPTION: "subscription_activated", // Nouvel abonnement souscrit
} as const;

export type AdminNotificationType =
  | "new_user"
  | "new_admin_user"
  | "report_submitted"
  | "subscription_activated";

/**
 * 🔍 Trouve tous les admins actifs (role "administrator")
 * Utilisé pour broadcaster les notifications admin
 */
async function getAdminUserIds(): Promise<string[]> {
  const admins = await prisma.userRole.findMany({
    where: {
      role: { name: "administrator" },
    },
    select: { userId: true },
  });
  return admins.map((a) => a.userId);
}

/**
 * 🔍 Trouve tous les staff pouvant recevoir les notifs (admin + moderator)
 */
async function getStaffUserIds(): Promise<string[]> {
  const staff = await prisma.userRole.findMany({
    where: {
      role: { name: { in: ["administrator", "moderator"] } },
    },
    select: { userId: true },
  });
  // Dédupliquer (un user peut avoir les deux rôles)
  return [...new Set(staff.map((s) => s.userId))];
}

/**
 * 🏗️ Crée une notification admin pour un userId donné
 */
async function createAdminNotification(params: {
  userId: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}) {
  const { userId, type, title, message, metadata = {} } = params;

  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      metadata: {
        ...metadata,
        adminOnly: true,
      } as any,
    },
  });
}

/**
 * 🏗️ Broadcasts une notification admin à plusieurs userId
 */
async function broadcastAdminNotification(params: {
  userIds: string[];
  type: AdminNotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}) {
  const { userIds, type, title, message, metadata = {} } = params;

  if (userIds.length === 0) return [];

  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      metadata: {
        ...metadata,
        adminOnly: true,
      } as any,
    })),
    skipDuplicates: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FONCTIONS PUBLIQUES — à appeler depuis les routes API / webhooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 👤 Notifie les admins qu'un nouvel utilisateur vient de s'inscrire
 */
export async function notifyAdminNewUser(newUserId: string) {
  try {
    const adminIds = await getAdminUserIds();
    if (adminIds.length === 0) return null;

    const newUser = await prisma.user.findUnique({
      where: { id: newUserId },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        createdAt: true,
        profil: { select: { pseudo: true, profilePhotoUrl: true } },
      },
    });

    if (!newUser) return null;

    const displayName =
      newUser.profil?.pseudo || `${newUser.prenom} ${newUser.nom}`;

    return broadcastAdminNotification({
      userIds: adminIds,
      type: "new_user",
      title: "Nouvel utilisateur inscrit",
      message: `${displayName} (${newUser.email}) vient de rejoindre la plateforme`,
      metadata: {
        newUserId: newUser.id,
        displayName,
        email: newUser.email,
        photo: newUser.profil?.profilePhotoUrl ?? null,
      },
    });
  } catch (error) {
    console.error("❌ notifyAdminNewUser:", error);
    return null;
  }
}

/**
 * 🛡️ Notifie l'admin créateur qu'un compte staff a été créé
 * (envoyé uniquement à l'admin qui a créé le compte, via creatorAdminId)
 */
export async function notifyAdminNewAdminUser(
  newAdminUserId: string,
  creatorAdminId: string,
) {
  try {
    const newAdmin = await prisma.user.findUnique({
      where: { id: newAdminUserId },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        roles: { select: { role: { select: { name: true } } } },
      },
    });

    if (!newAdmin) return null;

    const displayName = `${newAdmin.prenom} ${newAdmin.nom}`;
    const roleName = newAdmin.roles[0]?.role?.name ?? "staff";

    // Notifier également TOUS les admins (pas seulement le créateur)
    const adminIds = await getAdminUserIds();
    const targets = [...new Set([creatorAdminId, ...adminIds])];

    return broadcastAdminNotification({
      userIds: targets,
      type: "new_admin_user",
      title: "Nouveau compte staff créé",
      message: `${displayName} a été ajouté comme ${roleName}`,
      metadata: {
        newAdminUserId: newAdmin.id,
        displayName,
        email: newAdmin.email,
        role: roleName,
        creatorAdminId,
      },
    });
  } catch (error) {
    console.error("❌ notifyAdminNewAdminUser:", error);
    return null;
  }
}

/**
 * 🚨 Notifie les modérateurs + admins qu'un signalement a été soumis
 */
export async function notifyAdminReportSubmitted(reportId: string) {
  try {
    const staffIds = await getStaffUserIds();
    if (staffIds.length === 0) return null;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        reason: true,
        reporter: {
          select: {
            prenom: true,
            nom: true,
            profil: { select: { pseudo: true } },
          },
        },
        reportedUser: {
          select: {
            prenom: true,
            nom: true,
            profil: { select: { pseudo: true } },
          },
        },
        category: { select: { label: true } },
      },
    });

    if (!report) return null;

    const reporterName =
      report.reporter.profil?.pseudo ||
      `${report.reporter.prenom} ${report.reporter.nom}`;
    const reportedName =
      report.reportedUser.profil?.pseudo ||
      `${report.reportedUser.prenom} ${report.reportedUser.nom}`;

    return broadcastAdminNotification({
      userIds: staffIds,
      type: "report_submitted",
      title: "Nouveau signalement reçu",
      message: `${reporterName} a signalé ${reportedName} — ${report.category.label}`,
      metadata: {
        reportId: report.id,
        reporterName,
        reportedName,
        categoryLabel: report.category.label,
      },
    });
  } catch (error) {
    console.error("❌ notifyAdminReportSubmitted:", error);
    return null;
  }
}

/**
 * 💳 Notifie les admins + accountants qu'un abonnement a été souscrit
 */
export async function notifyAdminNewSubscription(params: {
  userId: string;
  subscriptionName: string;
  pricePaid: number;
  currencyCode: string;
  isClub: boolean;
}) {
  try {
    // Admins + accountants pour les infos financières
    const targets = await prisma.userRole.findMany({
      where: {
        role: { name: { in: ["administrator", "accountant"] } },
      },
      select: { userId: true },
    });
    const targetIds = [...new Set(targets.map((t) => t.userId))];
    if (targetIds.length === 0) return null;

    const subscriber = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        prenom: true,
        nom: true,
        email: true,
        profil: { select: { pseudo: true } },
      },
    });

    if (!subscriber) return null;

    const displayName =
      subscriber.profil?.pseudo || `${subscriber.prenom} ${subscriber.nom}`;

    const label = params.isClub
      ? `Club LWB — ${params.subscriptionName}`
      : params.subscriptionName;

    return broadcastAdminNotification({
      userIds: targetIds,
      type: "subscription_activated",
      title: "Nouvel abonnement souscrit",
      message: `${displayName} a souscrit à ${label} (${params.pricePaid} ${params.currencyCode})`,
      metadata: {
        subscriberUserId: params.userId,
        displayName,
        email: subscriber.email,
        subscriptionName: label,
        pricePaid: params.pricePaid,
        currencyCode: params.currencyCode,
        isClub: params.isClub,
      },
    });
  } catch (error) {
    console.error("❌ notifyAdminNewSubscription:", error);
    return null;
  }
}
