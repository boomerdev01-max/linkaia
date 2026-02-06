import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/profile/reference-data
 * 
 * Récupère toutes les données de référence pour le formulaire de profil
 */
export async function GET() {
  try {
    // Fetch all reference data in parallel
    const [interestCategories, cities, nationalities] = await Promise.all([
      // Interests with categories
      prisma.interestCategory.findMany({
        include: {
          interests: {
            orderBy: {
              name: "asc",
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      }),

      // Cities
      prisma.city.findMany({
        orderBy: [{ countryCode: "asc" }, { name: "asc" }],
      }),

      // Nationalities
      prisma.nationality.findMany({
        orderBy: {
          nameFr: "asc",
        },
      }),
    ]);

    return NextResponse.json({
      interestCategories,
      cities,
      nationalities,
    });
  } catch (error) {
    console.error("❌ Error fetching reference data:", error);
    return NextResponse.json(
      { error: "Failed to fetch reference data" },
      { status: 500 }
    );
  }
}