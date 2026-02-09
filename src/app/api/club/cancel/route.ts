// src/app/api/club/cancel/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { cancelClubSubscription } from "@/lib/stripe-club";

export async function POST() {
  try {
    const auth = await requireAuth();

    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    // Récupérer l'abonnement actuel
    const subscription = await prisma.clubSubscription.findUnique({
      where: { userId: auth.user.id },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { success: false, error: "Aucun abonnement actif trouvé" },
        { status: 400 }
      );
    }

    if (subscription.status === "cancelled") {
      return NextResponse.json(
        { success: false, error: "Cet abonnement est déjà annulé" },
        { status: 400 }
      );
    }

    // Annuler sur Stripe
    await cancelClubSubscription(subscription.stripeSubscriptionId);

    // Mettre à jour dans la base de données
    await prisma.clubSubscription.update({
      where: { userId: auth.user.id },
      data: {
        status: "cancelled",
        autoRenew: false,
      },
    });

    // Ajouter dans l'historique
    await prisma.clubSubscriptionHistory.create({
      data: {
        userId: auth.user.id,
        action: "cancelled",
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        pricePaid: subscription.pricePaid,
        currencyCode: subscription.currencyCode,
        period: subscription.period,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      },
    });

    // Créer une notification
    await prisma.notification.create({
      data: {
        userId: auth.user.id,
        type: "club_subscription_cancelled",
        title: "Abonnement Club LWB annulé",
        message:
          "Votre abonnement au Club fermé LWB sera annulé à la fin de la période en cours.",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Abonnement annulé avec succès",
    });
  } catch (error) {
    console.error("Error cancelling club subscription:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'annulation" },
      { status: 500 }
    );
  }
}