// src/app/api/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
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
    // ... ta validation + création de report ici ...

    // Exemple placeholder
    return NextResponse.json({
      success: true,
      message: "Signalement créé (route statique)",
    });
  } catch (error) {
    console.error("❌ POST /api/reports error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
