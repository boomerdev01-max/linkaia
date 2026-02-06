// app/api/subscriptions/current/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireAuth();

    if (!auth.authorized) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: "User not found in authentication context" },
        { status: 401 }
      );
    }

    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: auth.user.id },
      include: {
        subscriptionType: {
          include: {
            features: true,
            currency: true,
          },
        },
      },
    });

    // Récupérer l'historique
    const history = await prisma.subscriptionHistory.findMany({
      where: { userId: auth.user.id },
      include: {
        subscriptionType: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Récupérer les factures
    const stripeCustomer = await prisma.stripeCustomer.findUnique({
      where: { userId: auth.user.id },
      include: {
        invoices: {
          include: {
            currency: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    return NextResponse.json({
      success: true,
      subscription,
      history,
      invoices: stripeCustomer?.invoices || [],
    });
  } catch (error) {
    console.error("Error fetching current subscription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}