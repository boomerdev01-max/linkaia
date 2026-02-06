// app/api/subscriptions/current-user-subscription/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireAuth();

    if (!auth.authorized) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    // Récupérer l'abonnement actuel de l'utilisateur
    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: "User not found in authentication context" },
        { status: 401 },
      );
    }
    const userSubscription = await prisma.userSubscription.findFirst({
      where: { userId: auth.user.id, status: "active" },
      include: {
        subscriptionType: true,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: userSubscription,
    });
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user subscription" },
      { status: 500 },
    );
  }
}
