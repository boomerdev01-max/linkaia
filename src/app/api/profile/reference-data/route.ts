// src/app/api/profile/reference-data/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

// ✅ Cache module-level — persiste entre les invocations chaudes de la fonction
// Sur Vercel, une même instance peut être réutilisée pendant ~10-15min
let cache: {
  data: Record<string, unknown> | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Servir depuis le cache si valide
    if (cache.data && Date.now() - cache.timestamp < CACHE_TTL) {
      return NextResponse.json(cache.data, {
        headers: { "X-Cache": "HIT" },
      });
    }

    // ✅ Requêtes séquentielles par batch pour limiter les connexions simultanées
    // Batch 1 — toutes les petites tables de référence (légères)
    const [
      religions,
      zodiacSigns,
      sexualOrientations,
      relationshipStatuses,
      skinTones,
      personalityTypes,
      educationLevels,
      interestCategories,
    ] = await Promise.all([
      prisma.religion.findMany({
        orderBy: { order: "asc" },
        select: { id: true, code: true, label: true, emoji: true, order: true },
      }),
      prisma.zodiacSign.findMany({
        orderBy: { order: "asc" },
        select: { id: true, code: true, label: true, emoji: true, order: true },
      }),
      prisma.sexualOrientation.findMany({
        orderBy: { order: "asc" },
        select: { id: true, code: true, label: true, emoji: true, order: true },
      }),
      prisma.relationshipStatus.findMany({
        orderBy: { order: "asc" },
        select: { id: true, code: true, label: true, emoji: true, order: true },
      }),
      prisma.skinTone.findMany({
        orderBy: { order: "asc" },
        select: { id: true, code: true, label: true, emoji: true, order: true },
      }),
      prisma.personalityType.findMany({
        orderBy: { order: "asc" },
        select: { id: true, code: true, label: true, emoji: true, order: true },
      }),
      prisma.educationLevel.findMany({
        orderBy: { order: "asc" },
        select: { id: true, code: true, label: true, emoji: true, order: true },
      }),
      prisma.interestCategory.findMany({
        include: { interests: { orderBy: { name: "asc" } } },
        orderBy: { order: "asc" },
      }),
    ]);

    // Batch 2 — tables moyennes, séquentielles après batch 1
    const nationalities = await prisma.nationality.findMany({
      orderBy: { nameFr: "asc" },
      select: { id: true, code: true, nameFr: true, nameEn: true, flag: true },
    });

    // ✅ Villes — séparées et paginées côté API
    // On ne charge PAS toutes les villes ici : endpoint dédié /api/cities?search=
    // On charge seulement un subset léger pour l'initialisation
    const cities = await prisma.city.findMany({
      orderBy: [{ countryName: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        stateCode: true,
        stateName: true,
        countryCode: true,
        countryName: true,
        displayName: true,
        latitude: true,
        longitude: true,
      },
      take: 500, // ✅ LIMITER — charger le reste via recherche autocomplete
    });

    const response = {
      religions,
      zodiacSigns,
      sexualOrientations,
      relationshipStatuses,
      skinTones,
      personalityTypes,
      educationLevels,
      interestCategories: interestCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        emoji: cat.emoji,
        interests: cat.interests.map((i) => ({
          id: i.id,
          name: i.name,
          emoji: i.emoji,
        })),
      })),
      nationalities,
      cities, // subset initial — compléter avec /api/cities?search=
    };

    // ✅ Mettre en cache
    cache = { data: response, timestamp: Date.now() };

    return NextResponse.json(response, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("❌ Error fetching reference data:", error);
    return NextResponse.json(
      { error: "Failed to fetch reference data" },
      { status: 500 },
    );
  }
}
