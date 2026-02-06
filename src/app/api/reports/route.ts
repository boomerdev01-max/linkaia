// src/app/api/profile/[id]/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * GET /api/profile/[id]/reports
 * Vérifie si l'utilisateur connecté a déjà signalé ce profil
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

    // 2. Vérifier qu'on ne consulte pas son propre profil
    if (auth.user.id === profileUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous ne pouvez pas signaler votre propre profil",
        },
        { status: 400 },
      );
    }

    // 3. Chercher un signalement existant
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: auth.user.id,
        reportedUserId: profileUserId,
      },
      include: {
        category: {
          select: {
            id: true,
            code: true,
            label: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      existingReport,
      hasReported: !!existingReport,
    });
  } catch (error) {
    console.error("❌ GET /api/profile/[id]/reports error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/profile/[id]/reports
 * Créer un nouveau signalement
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

    // 2. Empêcher de signaler son propre profil
    if (auth.user.id === profileUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous ne pouvez pas signaler votre propre profil",
        },
        { status: 400 },
      );
    }

    // 3. Vérifier que le profil existe
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

    // 4. Vérifier qu'il n'y a pas déjà un signalement
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: auth.user.id,
        reportedUserId: profileUserId,
      },
    });

    if (existingReport) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous avez déjà signalé ce profil",
        },
        { status: 400 },
      );
    }

    // 5. Récupérer les données du body
    const body = await request.json();
    const { categoryId, reason } = body;

    // 6. Valider les données
    if (!categoryId || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: "Catégorie et raison sont requis",
        },
        { status: 400 },
      );
    }

    if (reason.trim().length < 20) {
      return NextResponse.json(
        {
          success: false,
          error: "La raison doit contenir au moins 20 caractères",
        },
        { status: 400 },
      );
    }

    if (reason.trim().length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: "La raison ne peut pas dépasser 1000 caractères",
        },
        { status: 400 },
      );
    }

    // 7. Vérifier que la catégorie existe et est active
    const category = await prisma.reportCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, isActive: true },
    });

    if (!category || !category.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Catégorie invalide",
        },
        { status: 400 },
      );
    }

    // 8. Créer le signalement
    const report = await prisma.report.create({
      data: {
        reporterId: auth.user.id,
        reportedUserId: profileUserId,
        categoryId,
        reason: reason.trim(),
        status: "pending",
      },
      include: {
        category: {
          select: {
            id: true,
            code: true,
            label: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Signalement envoyé avec succès",
      report,
    });
  } catch (error) {
    console.error("❌ POST /api/profile/[id]/reports error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
