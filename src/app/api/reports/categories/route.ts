// src/app/api/reports/categories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/reports/categories
 * Récupère la liste des catégories de signalement actives
 */
export async function GET() {
  try {
    const categories = await prisma.reportCategory.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        code: true,
        label: true,
        description: true,
        order: true,
      },
    });

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("❌ GET /api/reports/categories error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
