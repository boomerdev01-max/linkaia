// src/app/api/admin/services/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    const canView = await userHasPermission(user.id, "dashboard.view");
    if (!canView) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // ── Query params ──────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || ""; // active | cancelled | expired
    const plan = searchParams.get("plan") || ""; // subscriptionType code
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const source = searchParams.get("source") || "all"; // all | stripe | premium | club

    const skip = (page - 1) * limit;

    // ── Filtre utilisateur commun ─────────────────────────────────
    const userWhere = search
      ? {
          OR: [
            { nom: { contains: search, mode: "insensitive" as const } },
            { prenom: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // ── 1. StripeInvoice ─────────────────────────────────────────
    const stripeWhere: any = {};
    if (dateFrom)
      stripeWhere.createdAt = {
        ...stripeWhere.createdAt,
        gte: new Date(dateFrom),
      };
    if (dateTo)
      stripeWhere.createdAt = {
        ...stripeWhere.createdAt,
        lte: new Date(dateTo + "T23:59:59Z"),
      };
    if (status) stripeWhere.status = status === "active" ? "paid" : status;
    if (search) {
      stripeWhere.stripeCustomer = { user: userWhere };
    }

    const stripeInvoices =
      source === "club"
        ? []
        : await prisma.stripeInvoice.findMany({
            where: stripeWhere,
            include: {
              stripeCustomer: {
                include: {
                  user: {
                    select: { id: true, nom: true, prenom: true, email: true },
                  },
                },
              },
              currency: true,
            },
            orderBy: { createdAt: "desc" },
          });

    // ── 2. SubscriptionHistory (premium) ─────────────────────────
    const subHistWhere: any = {};
    if (dateFrom)
      subHistWhere.createdAt = {
        ...subHistWhere.createdAt,
        gte: new Date(dateFrom),
      };
    if (dateTo)
      subHistWhere.createdAt = {
        ...subHistWhere.createdAt,
        lte: new Date(dateTo + "T23:59:59Z"),
      };
    if (plan) subHistWhere.subscriptionType = { code: plan };
    if (search) subHistWhere.user = userWhere;
    // On exclut les downgrades vers FREE (pricePaid = 0) pour ne garder que les vrai paiements
    subHistWhere.pricePaid = { gt: 0 };

    const subHistory =
      source === "club" || source === "stripe"
        ? []
        : await prisma.subscriptionHistory.findMany({
            where: subHistWhere,
            include: {
              user: {
                select: { id: true, nom: true, prenom: true, email: true },
              },
              subscriptionType: {
                select: { id: true, code: true, name: true },
              },
            },
            orderBy: { createdAt: "desc" },
          });

    // ── 3. ClubSubscriptionHistory ────────────────────────────────
    const clubWhere: any = {};
    if (dateFrom)
      clubWhere.createdAt = { ...clubWhere.createdAt, gte: new Date(dateFrom) };
    if (dateTo)
      clubWhere.createdAt = {
        ...clubWhere.createdAt,
        lte: new Date(dateTo + "T23:59:59Z"),
      };
    if (search) clubWhere.user = userWhere;
    clubWhere.pricePaid = { gt: 0 };

    const clubHistory =
      source === "stripe" || source === "premium"
        ? []
        : await prisma.clubSubscriptionHistory.findMany({
            where: clubWhere,
            include: {
              user: {
                select: { id: true, nom: true, prenom: true, email: true },
              },
            },
            orderBy: { createdAt: "desc" },
          });

    // ── Normaliser en format unifié ───────────────────────────────
    type Transaction = {
      id: string;
      source: "stripe" | "premium" | "club";
      userId: string;
      userName: string;
      userEmail: string;
      amount: number;
      currency: string;
      plan: string;
      status: string;
      date: Date;
      invoiceUrl: string | null;
      invoicePdf: string | null;
    };

    const transactions: Transaction[] = [
      ...stripeInvoices.map((inv) => ({
        id: `stripe_${inv.id}`,
        source: "stripe" as const,
        userId: inv.stripeCustomer.user.id,
        userName: `${inv.stripeCustomer.user.prenom} ${inv.stripeCustomer.user.nom}`,
        userEmail: inv.stripeCustomer.user.email,
        amount: inv.amountPaid,
        currency: inv.currencyId,
        plan: "Abonnement Premium",
        status: inv.status === "paid" ? "active" : inv.status,
        date: inv.paidAt ?? inv.createdAt,
        invoiceUrl: inv.hostedInvoiceUrl,
        invoicePdf: inv.invoicePdf,
      })),

      ...subHistory.map((sh) => ({
        id: `premium_${sh.id}`,
        source: "premium" as const,
        userId: sh.user.id,
        userName: `${sh.user.prenom} ${sh.user.nom}`,
        userEmail: sh.user.email,
        amount: sh.pricePaid,
        currency: sh.currencyCode ?? "XOF",
        plan: sh.subscriptionType.name,
        status:
          sh.action === "subscribed" || sh.action === "upgraded"
            ? "active"
            : "cancelled",
        date: sh.createdAt,
        invoiceUrl: null,
        invoicePdf: null,
      })),

      ...clubHistory.map((ch) => ({
        id: `club_${ch.id}`,
        source: "club" as const,
        userId: ch.user.id,
        userName: `${ch.user.prenom} ${ch.user.nom}`,
        userEmail: ch.user.email,
        amount: ch.pricePaid,
        currency: ch.currencyCode,
        plan: `Club (${ch.period === "yearly" ? "Annuel" : "Mensuel"})`,
        status:
          ch.action === "subscribed" || ch.action === "renewed"
            ? "active"
            : "cancelled",
        date: ch.createdAt,
        invoiceUrl: null,
        invoicePdf: null,
      })),
    ];

    // ── Tri global par date desc, et filtre status ──────────────
    let filtered = transactions.sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );

    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    // ── Stats ─────────────────────────────────────────────────────
    const totalRevenue = filtered.reduce((sum, t) => sum + t.amount, 0);
    const totalActive = filtered.filter((t) => t.status === "active").length;
    const totalCount = filtered.length;

    // ── Pagination ────────────────────────────────────────────────
    const paginated = filtered.slice(skip, skip + limit);

    return NextResponse.json({
      transactions: paginated,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalRevenue,
        totalCount,
        totalActive,
        totalCancelled: totalCount - totalActive,
      },
    });
  } catch (error) {
    console.error("Erreur API /admin/services/transactions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
