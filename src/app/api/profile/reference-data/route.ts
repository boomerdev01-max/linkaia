// src/app/api/profile/reference-data/route.ts - VERSION COMPLÈTE MISE À JOUR

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ RÉCUPÉRATION EN PARALLÈLE DE TOUTES LES DONNÉES DE RÉFÉRENCE
    const [
      religions,
      zodiacSigns,
      sexualOrientations,
      relationshipStatuses,
      skinTones,
      personalityTypes,
      educationLevels,
      interestCategories,
      nationalities,
      cities,
    ] = await Promise.all([
      // 1️⃣ Religions
      prisma.religion.findMany({
        orderBy: { order: "asc" },
        select: {
          id: true,
          code: true,
          label: true,
          emoji: true,
          order: true,
        },
      }),

      // 2️⃣ Signes astrologiques
      prisma.zodiacSign.findMany({
        orderBy: { order: "asc" },
        select: {
          id: true,
          code: true,
          label: true,
          emoji: true,
          order: true,
        },
      }),

      // 3️⃣ Orientations sexuelles
      prisma.sexualOrientation.findMany({
        orderBy: { order: "asc" },
        select: {
          id: true,
          code: true,
          label: true,
          emoji: true,
          order: true,
        },
      }),

      // 4️⃣ Statuts relationnels
      prisma.relationshipStatus.findMany({
        orderBy: { order: "asc" },
        select: {
          id: true,
          code: true,
          label: true,
          emoji: true,
          order: true,
        },
      }),

      // 5️⃣ Teints de peau
      prisma.skinTone.findMany({
        orderBy: { order: "asc" },
        select: {
          id: true,
          code: true,
          label: true,
          emoji: true,
          order: true,
        },
      }),

      // 6️⃣ Types de personnalité
      prisma.personalityType.findMany({
        orderBy: { order: "asc" },
        select: {
          id: true,
          code: true,
          label: true,
          emoji: true,
          order: true,
        },
      }),

      // 7️⃣ Niveaux d'éducation
      prisma.educationLevel.findMany({
        orderBy: { order: "asc" },
        select: {
          id: true,
          code: true,
          label: true,
          emoji: true,
          order: true,
        },
      }),

      // 8️⃣ Catégories d'intérêts (existant)
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

      // 9️⃣ Nationalités
      prisma.nationality.findMany({
        orderBy: {
          nameFr: "asc",
        },
        select: {
          id: true,
          code: true,
          nameFr: true,
          nameEn: true,
          flag: true,
        },
      }),

      // 🔟 Villes
      prisma.city.findMany({
        orderBy: [
          { countryName: "asc" },
          { stateName: "asc" },
          { name: "asc" },
        ],
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
      }),
    ]);

    // ✅ FORMAT OPTIMISÉ POUR LE FRONTEND
    const response = {
      // Nouvelles tables de référence
      religions,
      zodiacSigns,
      sexualOrientations,
      relationshipStatuses,
      skinTones,
      personalityTypes,
      educationLevels,

      // Existantes
      interestCategories: interestCategories.map((category) => ({
        id: category.id,
        name: category.name,
        emoji: category.emoji,
        interests: category.interests.map((interest) => ({
          id: interest.id,
          name: interest.name,
          emoji: interest.emoji,
        })),
      })),

      nationalities: nationalities.map((nat) => ({
        id: nat.id,
        code: nat.code,
        nameFr: nat.nameFr,
        nameEn: nat.nameEn,
        flag: nat.flag,
      })),

      cities: cities.map((city) => ({
        id: city.id,
        name: city.name,
        stateCode: city.stateCode,
        stateName: city.stateName,
        countryCode: city.countryCode,
        countryName: city.countryName,
        displayName: city.displayName,
        latitude: city.latitude,
        longitude: city.longitude,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Error fetching reference data:", error);
    return NextResponse.json(
      { error: "Failed to fetch reference data" },
      { status: 500 },
    );
  }
}
