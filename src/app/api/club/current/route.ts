// src/app/api/club/current/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireAuth();

    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    // Récupérer l'abonnement Club LWB de l'utilisateur
    const subscription = await prisma.clubSubscription.findUnique({
      where: { userId: auth.user.id },
    });

    // Récupérer l'historique
    const history = await prisma.clubSubscriptionHistory.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      subscription,
      history,
      hasAccess: subscription?.status === "active",
    });
  } catch (error) {
    console.error("Error fetching club subscription:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération de l'abonnement" },
      { status: 500 }
    );
  }
}