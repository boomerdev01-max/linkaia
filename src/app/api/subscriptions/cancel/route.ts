// app/api/subscriptions/cancel/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const auth = await requireAuth();

    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: auth.user.id },
    });

    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { success: false, error: "Aucun abonnement actif trouvé" },
        { status: 400 },
      );
    }

    // Annuler l'abonnement sur Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Mettre à jour dans la base de données
    await prisma.userSubscription.update({
      where: { userId: auth.user.id },
      data: {
        autoRenew: false,
        status: "cancelled",
      },
    });

    // Créer une notification
    await prisma.notification.create({
      data: {
        userId: auth.user.id,
        type: "subscription_cancelled",
        title: "Abonnement annulé",
        message:
          "Votre abonnement sera annulé à la fin de la période en cours.",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Abonnement annulé avec succès",
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel subscription" },
      { status: 500 },
    );
  }
}
