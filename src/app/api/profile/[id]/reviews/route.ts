// src/app/api/profile/[id]/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * GET /api/profile/[id]/reviews
 * Récupère tous les avis d'un profil + statistiques
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Vérifier l'authentification
    const auth = await requireAuth();
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    const { id: profileUserId } = await params;

    // 2. Vérifier que le profil existe
    const profileUser = await prisma.user.findUnique({
      where: { id: profileUserId },
      select: { id: true },
    });

    if (!profileUser) {
      return NextResponse.json(
        { success: false, error: "Profil non trouvé" },
        { status: 404 },
      );
    }

    // 3. Récupérer tous les avis visibles
    const reviews = await prisma.review.findMany({
      where: {
        reviewedUserId: profileUserId,
        isVisible: true,
      },
      include: {
        reviewer: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 4. Calculer les statistiques
    const totalReviews = reviews.length;
    const sumRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalReviews > 0 ? sumRatings / totalReviews : 0;

    // Distribution des notes
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      }
    });

    // 5. Vérifier si l'utilisateur connecté a déjà laissé un avis
    const userReview = reviews.find(
      (review) => review.reviewer.id === auth.user.id,
    );

    return NextResponse.json({
      success: true,
      reviews,
      stats: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        ratingDistribution,
      },
      userReview: userReview || null,
    });
  } catch (error) {
    console.error("❌ GET /api/profile/[id]/reviews error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/profile/[id]/reviews
 * Créer un nouvel avis
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Vérifier l'authentification
    const auth = await requireAuth();
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    const { id: profileUserId } = await params;

    // 2. Empêcher de laisser un avis sur son propre profil
    if (auth.user.id === profileUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous ne pouvez pas laisser un avis sur votre propre profil",
        },
        { status: 400 },
      );
    }

    // 3. Vérifier que le profil existe
    const profileUser = await prisma.user.findUnique({
      where: { id: profileUserId },
      select: {
        id: true,
        prenom: true,
        nom: true,
        profil: {
          select: {
            pseudo: true,
          },
        },
      },
    });

    if (!profileUser) {
      return NextResponse.json(
        { success: false, error: "Profil non trouvé" },
        { status: 404 },
      );
    }

    // 4. Vérifier qu'il n'y a pas déjà un avis
    const existingReview = await prisma.review.findUnique({
      where: {
        reviewerId_reviewedUserId: {
          reviewerId: auth.user.id,
          reviewedUserId: profileUserId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Vous avez déjà laissé un avis sur ce profil. Utilisez PUT pour le modifier.",
        },
        { status: 400 },
      );
    }

    // 5. Récupérer les données du body
    const body = await request.json();
    const { rating, comment } = body;

    // 6. Valider les données
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          error: "La note doit être entre 1 et 5",
        },
        { status: 400 },
      );
    }

    if (!comment || comment.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Le commentaire doit contenir au moins 10 caractères",
        },
        { status: 400 },
      );
    }

    if (comment.trim().length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: "Le commentaire ne peut pas dépasser 500 caractères",
        },
        { status: 400 },
      );
    }

    // 7. Créer l'avis
    const review = await prisma.review.create({
      data: {
        reviewerId: auth.user.id,
        reviewedUserId: profileUserId,
        rating: parseInt(rating),
        comment: comment.trim(),
        isVisible: true,
      },
      include: {
        reviewer: {
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
        },
      },
    });

    // 8. 📢 Créer une notification pour l'utilisateur qui reçoit l'avis
    try {
      const reviewerName =
        auth.user.profil?.pseudo || `${auth.user.prenom} ${auth.user.nom}`;

      await prisma.notification.create({
        data: {
          userId: profileUserId,
          type: "new_review",
          title: "Nouvel avis reçu",
          message: `${reviewerName} a laissé un avis ${rating} étoiles sur votre profil`,
          metadata: {
            reviewId: review.id,
            reviewerId: auth.user.id,
            reviewerName,
            reviewerPhoto: auth.user.profil?.profilePhotoUrl,
            rating,
          } as any,
        },
      });
    } catch (notifError) {
      console.error("❌ Error creating review notification:", notifError);
      // On ne fait pas échouer la création de l'avis si la notification échoue
    }

    return NextResponse.json({
      success: true,
      message: "Avis publié avec succès",
      review,
    });
  } catch (error) {
    console.error("❌ POST /api/profile/[id]/reviews error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/profile/[id]/reviews
 * Modifier un avis existant
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Vérifier l'authentification
    const auth = await requireAuth();
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    const { id: profileUserId } = await params;

    // 2. Empêcher de modifier un avis sur son propre profil
    if (auth.user.id === profileUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous ne pouvez pas modifier un avis sur votre propre profil",
        },
        { status: 400 },
      );
    }

    // 3. Vérifier que l'avis existe
    const existingReview = await prisma.review.findUnique({
      where: {
        reviewerId_reviewedUserId: {
          reviewerId: auth.user.id,
          reviewedUserId: profileUserId,
        },
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous n'avez pas encore laissé d'avis sur ce profil",
        },
        { status: 404 },
      );
    }

    // 4. Récupérer les données du body
    const body = await request.json();
    const { rating, comment } = body;

    // 5. Valider les données
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          error: "La note doit être entre 1 et 5",
        },
        { status: 400 },
      );
    }

    if (!comment || comment.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Le commentaire doit contenir au moins 10 caractères",
        },
        { status: 400 },
      );
    }

    if (comment.trim().length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: "Le commentaire ne peut pas dépasser 500 caractères",
        },
        { status: 400 },
      );
    }

    // 6. Mettre à jour l'avis
    const updatedReview = await prisma.review.update({
      where: {
        id: existingReview.id,
      },
      data: {
        rating: parseInt(rating),
        comment: comment.trim(),
      },
      include: {
        reviewer: {
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
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Avis mis à jour avec succès",
      review: updatedReview,
    });
  } catch (error) {
    console.error("❌ PUT /api/profile/[id]/reviews error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/profile/[id]/reviews
 * Supprimer son avis
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Vérifier l'authentification
    const auth = await requireAuth();
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    const { id: profileUserId } = await params;

    // 2. Vérifier que l'avis existe
    const existingReview = await prisma.review.findUnique({
      where: {
        reviewerId_reviewedUserId: {
          reviewerId: auth.user.id,
          reviewedUserId: profileUserId,
        },
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous n'avez pas d'avis à supprimer sur ce profil",
        },
        { status: 404 },
      );
    }

    // 3. Supprimer l'avis
    await prisma.review.delete({
      where: {
        id: existingReview.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Avis supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ DELETE /api/profile/[id]/reviews error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
