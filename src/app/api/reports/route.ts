// src/app/api/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { notifyAdminReportSubmitted } from "@/lib/admin-notification-helpers";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * GET /api/reports
 * Récupère la liste des signalements (ou vérifie quelque chose global)
 * → Adaptez selon ce que fait vraiment cette route
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentification
    const auth = await requireAuth();
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    // Ici : ton code réel pour récupérer les reports
    // Exemple placeholder (remplace par ta logique)
    const reports = await prisma.report.findMany({
      where: {
        reporterId: auth.user.id, // ou autre filtre global
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("❌ GET /api/reports error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/reports
 * Créer un signalement global (si c'est le but de cette route)
 * → Si cette route n'existe pas vraiment, supprime-la ou adapte
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    const body = await request.json();
    const { profileId, categoryId, reason } = body as {
      profileId: string;
      categoryId: string;
      reason: string;
    };

    if (!profileId || !categoryId || !reason?.trim()) {
      return NextResponse.json(
        { success: false, error: "Champs manquants" },
        { status: 400 },
      );
    }

    if (reason.trim().length < 20) {
      return NextResponse.json(
        { success: false, error: "Raison trop courte (min 20 caractères)" },
        { status: 400 },
      );
    }

    // Empêcher l'auto-signalement
    if (profileId === auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Vous ne pouvez pas vous signaler vous-même" },
        { status: 400 },
      );
    }

    const report = await prisma.report.create({
      data: {
        reporterId: auth.user.id,
        reportedUserId: profileId,
        categoryId,
        reason: reason.trim(),
        status: "pending",
      },
    });

    // 📢 Notifier les admins/modérateurs
    await notifyAdminReportSubmitted(report.id).catch(console.error);

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("❌ POST /api/reports error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
