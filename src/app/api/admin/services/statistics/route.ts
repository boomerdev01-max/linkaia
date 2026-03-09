// src/app/api/admin/services/statistics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";

async function getAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();
  if (!supabaseUser) return null;
  return prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: { id: true },
  });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const canView = await userHasPermission(user.id, "statistics.view");
    if (!canView)
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") ?? "overview";
    const days = parseInt(searchParams.get("days") ?? "30");

    const since = new Date();
    since.setDate(since.getDate() - days);

    // ─────────────────────────────────────────────────────────────────────────
    // OVERVIEW
    // ─────────────────────────────────────────────────────────────────────────
    if (tab === "overview") {
      const [
        totalPremiumSubs,
        activePremiumSubs,
        totalClubSubs,
        activeClubSubs,
        recentPremiumRevenue,
        recentClubRevenue,
        allPremiumHistory,
        allClubHistory,
        userLevels,
      ] = await Promise.all([
        prisma.userSubscription.count(),
        prisma.userSubscription.count({ where: { status: "active" } }),
        prisma.clubSubscription.count(),
        prisma.clubSubscription.count({ where: { status: "active" } }),

        // Revenus premium période sélectionnée
        prisma.subscriptionHistory.aggregate({
          _sum: { pricePaid: true },
          where: {
            createdAt: { gte: since },
            action: { in: ["subscribed", "upgraded", "renewed"] },
          },
        }),

        // Revenus club période sélectionnée
        prisma.clubSubscriptionHistory.aggregate({
          _sum: { pricePaid: true },
          where: {
            createdAt: { gte: since },
            action: { in: ["subscribed", "renewed"] },
          },
        }),

        // Historique premium pour graphe mensuel (6 mois)
        prisma.subscriptionHistory.findMany({
          where: {
            createdAt: { gte: (() => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d; })() },
            action: { in: ["subscribed", "upgraded", "renewed"] },
          },
          select: { pricePaid: true, createdAt: true },
        }),

        // Historique club pour graphe mensuel (6 mois)
        prisma.clubSubscriptionHistory.findMany({
          where: {
            createdAt: { gte: (() => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d; })() },
            action: { in: ["subscribed", "renewed"] },
          },
          select: { pricePaid: true, createdAt: true },
        }),

        // Distribution niveaux utilisateurs
        prisma.user.groupBy({
          by: ["level"],
          _count: { level: true },
        }),
      ]);

      const premiumRevenue = recentPremiumRevenue._sum.pricePaid ?? 0;
      const clubRevenue = recentClubRevenue._sum.pricePaid ?? 0;
      const totalRevenue = premiumRevenue + clubRevenue;

      // Construire graphe mensuel sur 6 mois
      const monthlyMap: Record<string, { premium: number; club: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
        monthlyMap[key] = { premium: 0, club: 0 };
      }

      allPremiumHistory.forEach((h) => {
        const key = new Date(h.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
        if (monthlyMap[key]) monthlyMap[key].premium += h.pricePaid;
      });
      allClubHistory.forEach((h) => {
        const key = new Date(h.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
        if (monthlyMap[key]) monthlyMap[key].club += h.pricePaid;
      });

      const revenueByMonth = Object.entries(monthlyMap).map(([month, v]) => ({
        month,
        premium: Math.round(v.premium),
        club: Math.round(v.club),
        total: Math.round(v.premium + v.club),
      }));

      const levelMap: Record<string, number> = {};
      userLevels.forEach((l) => { levelMap[l.level] = l._count.level; });

      return NextResponse.json({
        success: true,
        overview: {
          revenue: { premium: Math.round(premiumRevenue), club: Math.round(clubRevenue), total: Math.round(totalRevenue) },
          subscriptions: {
            premium: { total: totalPremiumSubs, active: activePremiumSubs },
            club: { total: totalClubSubs, active: activeClubSubs },
          },
          userLevels: {
            free: levelMap["free"] ?? 0,
            premium: levelMap["premium"] ?? 0,
            platinium: levelMap["platinium"] ?? 0,
            prestige: levelMap["prestige"] ?? 0,
          },
          revenueByMonth,
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUBSCRIPTIONS (VIP / PLATINUM)
    // ─────────────────────────────────────────────────────────────────────────
    if (tab === "subscriptions") {
      const [
        activeByType,
        newSubs,
        renewals,
        downgrades,
        recentTransactions,
        totalRevByType,
      ] = await Promise.all([
        // Actifs groupés par type
        prisma.userSubscription.findMany({
          where: { status: "active" },
          include: { subscriptionType: { select: { code: true, name: true } } },
        }),

        // Nouveaux abonnements période
        prisma.subscriptionHistory.count({
          where: { createdAt: { gte: since }, action: "subscribed" },
        }),

        // Renouvellements
        prisma.subscriptionHistory.count({
          where: { createdAt: { gte: since }, action: "renewed" },
        }),

        // Downgrades / annulations
        prisma.subscriptionHistory.count({
          where: { createdAt: { gte: since }, action: { in: ["downgraded", "cancelled"] } },
        }),

        // 20 dernières transactions
        prisma.subscriptionHistory.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          where: { createdAt: { gte: since } },
          include: {
            user: { select: { email: true, profil: { select: { pseudo: true } } } },
            subscriptionType: { select: { name: true, code: true } },
          },
        }),

        // Revenus par type sur la période
        prisma.subscriptionHistory.groupBy({
          by: ["subscriptionTypeId"],
          _sum: { pricePaid: true },
          where: {
            createdAt: { gte: since },
            action: { in: ["subscribed", "upgraded", "renewed"] },
          },
        }),
      ]);

      // Compter actifs par code
      const activeMap: Record<string, number> = { FREE: 0, VIP: 0, PLATINUM: 0 };
      activeByType.forEach((s) => {
        const code = s.subscriptionType.code;
        activeMap[code] = (activeMap[code] ?? 0) + 1;
      });

      // Résoudre les ids → revenus
      const subTypes = await prisma.subscriptionType.findMany({ select: { id: true, code: true } });
      const idToCode: Record<string, string> = {};
      subTypes.forEach((t) => { idToCode[t.id] = t.code; });

      const revenueByCode: Record<string, number> = {};
      totalRevByType.forEach((r) => {
        const code = idToCode[r.subscriptionTypeId];
        if (code) revenueByCode[code] = Math.round(r._sum.pricePaid ?? 0);
      });

      const totalActive = activeMap["FREE"] + activeMap["VIP"] + activeMap["PLATINUM"];
      const paidActive = activeMap["VIP"] + activeMap["PLATINUM"];
      const conversionRate = totalActive > 0 ? Math.round((paidActive / totalActive) * 100) : 0;

      return NextResponse.json({
        success: true,
        stats: {
          active: {
            free: activeMap["FREE"],
            vip: activeMap["VIP"],
            platinum: activeMap["PLATINUM"],
            total: totalActive,
          },
          newSubscriptions: {
            total: newSubs,
          },
          renewals,
          downgrades,
          revenue: {
            vip: revenueByCode["VIP"] ?? 0,
            platinum: revenueByCode["PLATINUM"] ?? 0,
            total: (revenueByCode["VIP"] ?? 0) + (revenueByCode["PLATINUM"] ?? 0),
          },
          metrics: {
            conversionRate,
            churnRate: totalActive > 0 ? Math.round((downgrades / totalActive) * 100) : 0,
          },
        },
        recentTransactions: recentTransactions.map((t) => ({
          id: t.id,
          action: t.action,
          pricePaid: t.pricePaid,
          createdAt: t.createdAt,
          user: { pseudo: t.user.profil?.pseudo ?? t.user.email, email: t.user.email },
          subscriptionType: { name: t.subscriptionType.name, code: t.subscriptionType.code },
        })),
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CLUB
    // ─────────────────────────────────────────────────────────────────────────
    if (tab === "club") {
      const [
        activeClub,
        cancelledClub,
        expiredClub,
        monthlyCount,
        yearlyCount,
        newClub,
        renewalsClub,
        cancellationsClub,
        expirationsClub,
        revenueMonthly,
        revenueYearly,
        recentTransactions,
      ] = await Promise.all([
        prisma.clubSubscription.count({ where: { status: "active" } }),
        prisma.clubSubscription.count({ where: { status: "cancelled" } }),
        prisma.clubSubscription.count({ where: { status: "expired" } }),
        prisma.clubSubscription.count({ where: { status: "active", period: "monthly" } }),
        prisma.clubSubscription.count({ where: { status: "active", period: "yearly" } }),

        prisma.clubSubscriptionHistory.count({ where: { createdAt: { gte: since }, action: "subscribed" } }),
        prisma.clubSubscriptionHistory.count({ where: { createdAt: { gte: since }, action: "renewed" } }),
        prisma.clubSubscriptionHistory.count({ where: { createdAt: { gte: since }, action: "cancelled" } }),
        prisma.clubSubscriptionHistory.count({ where: { createdAt: { gte: since }, action: "expired" } }),

        prisma.clubSubscriptionHistory.aggregate({
          _sum: { pricePaid: true },
          where: { createdAt: { gte: since }, period: "monthly", action: { in: ["subscribed", "renewed"] } },
        }),
        prisma.clubSubscriptionHistory.aggregate({
          _sum: { pricePaid: true },
          where: { createdAt: { gte: since }, period: "yearly", action: { in: ["subscribed", "renewed"] } },
        }),

        prisma.clubSubscriptionHistory.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          where: { createdAt: { gte: since } },
          include: {
            user: { select: { email: true, profil: { select: { pseudo: true } } } },
          },
        }),
      ]);

      const revM = Math.round(revenueMonthly._sum.pricePaid ?? 0);
      const revY = Math.round(revenueYearly._sum.pricePaid ?? 0);
      const totalRev = revM + revY;
      const retentionRate = (activeClub + cancelledClub + expiredClub) > 0
        ? Math.round((activeClub / (activeClub + cancelledClub + expiredClub)) * 100)
        : 0;

      return NextResponse.json({
        success: true,
        stats: {
          subscriptions: {
            active: activeClub,
            cancelled: cancelledClub,
            expired: expiredClub,
            total: activeClub + cancelledClub + expiredClub,
          },
          byPeriod: { monthly: monthlyCount, yearly: yearlyCount },
          activity: {
            newSubscriptions: newClub,
            renewals: renewalsClub,
            cancellations: cancellationsClub,
            expirations: expirationsClub,
          },
          revenue: { monthly: revM, yearly: revY, total: totalRev },
          metrics: {
            retentionRate,
            averageRevenuePerUser: activeClub > 0 ? Math.round(totalRev / activeClub) : 0,
          },
        },
        recentTransactions: recentTransactions.map((t) => ({
          id: t.id,
          action: t.action,
          pricePaid: t.pricePaid,
          period: t.period,
          createdAt: t.createdAt,
          user: { pseudo: t.user.profil?.pseudo ?? t.user.email, email: t.user.email },
        })),
      });
    }

    return NextResponse.json({ error: "Tab invalide" }, { status: 400 });
  } catch (error) {
    console.error("Erreur API /admin/services/statistics:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}