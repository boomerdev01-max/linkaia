// src/app/api/profile/[id]/like/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { notifyProfileLike } from "@/lib/notification-helpers";

/**
 * GET /api/profile/[id]/like
 * Récupère le statut du like (est-ce que l'utilisateur a liké ce profil)
 * et le nombre total de likes du profil
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
        { status: 404 }
      );
    }

    // 3. Vérifier si l'utilisateur a déjà liké ce profil
    const existingLike = await prisma.profileLike.findUnique({
      where: {
        userId_profileId: {
          userId: auth.user.id,
          profileId: profileUserId,
        },
      },
    });

    // 4. Compter le nombre total de likes du profil
    const likesCount = await prisma.profileLike.count({
      where: { profileId: profileUserId },
    });

    return NextResponse.json({
      success: true,
      isLiked: !!existingLike,
      likesCount,
    });
  } catch (error) {
    console.error("❌ GET /api/profile/[id]/like error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/[id]/like
 * Ajoute un like au profil
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Vérifier l'authentification
    const auth = await requireAuth();
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    const { id: profileUserId } = await params;

    // 2. Empêcher de liker son propre profil
    if (auth.user.id === profileUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous ne pouvez pas liker votre propre profil",
        },
        { status: 400 }
      );
    }

    // 3. Vérifier que le profil existe
    const profileUser = await prisma.user.findUnique({
      where: { id: profileUserId },
      select: { id: true, prenom: true, nom: true },
    });

    if (!profileUser) {
      return NextResponse.json(
        { success: false, error: "Profil non trouvé" },
        { status: 404 }
      );
    }

    // 4. Créer le like (upsert pour éviter les doublons)
    await prisma.profileLike.upsert({
      where: {
        userId_profileId: {
          userId: auth.user.id,
          profileId: profileUserId,
        },
      },
      update: {}, // Si existe déjà, ne rien faire
      create: {
        userId: auth.user.id,
        profileId: profileUserId,
      },
    });

    // 5. Compter le nouveau nombre de likes
    const likesCount = await prisma.profileLike.count({
      where: { profileId: profileUserId },
    });

    // 6. ✨ Créer une notification pour l'utilisateur liké
    await notifyProfileLike(auth.user.id, profileUserId);

    return NextResponse.json({
      success: true,
      isLiked: true,
      likesCount,
      message: "Profil liké avec succès",
    });
  } catch (error) {
    console.error("❌ POST /api/profile/[id]/like error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/[id]/like
 * Retire le like du profil
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Vérifier l'authentification
    const auth = await requireAuth();
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    const { id: profileUserId } = await params;

    // 2. Supprimer le like s'il existe
    const deletedLike = await prisma.profileLike.deleteMany({
      where: {
        userId: auth.user.id,
        profileId: profileUserId,
      },
    });

    // 3. Compter le nouveau nombre de likes
    const likesCount = await prisma.profileLike.count({
      where: { profileId: profileUserId },
    });

    return NextResponse.json({
      success: true,
      isLiked: false,
      likesCount,
      message: "Like retiré avec succès",
    });
  } catch (error) {
    console.error("❌ DELETE /api/profile/[id]/like error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}