// src/app/api/preference/init/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Récupérer l'utilisateur Supabase
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Récupérer l'utilisateur Prisma correspondant
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.id;

    // 3️⃣ Vérifier si une préférence existe déjà (juste pour le flag isNew)
    const existingPreference = await prisma.preference.findUnique({
      where: { userId },
      select: { id: true },
    });

    // 4️⃣ Upsert idempotent :
    //    - si aucune préférence n'existe → create
    //    - si elle existe déjà → update (ici vide, juste pour récupérer les relations)
    const preference = await prisma.preference.upsert({
      where: { userId },
      update: {}, // rien à mettre pour l'init, on ne fait que garantir l'existence
      create: {
        userId,
      },
      include: {
        selectedGenders: true,
        selectedSkinTones: {
          include: { skinTone: true },
        },
        selectedRelationshipStatuses: {
          include: { relationshipStatus: true },
        },
        selectedSexualOrientations: {
          include: { sexualOrientation: true },
        },
        selectedInterests: {
          include: {
            interest: {
              include: {
                category: true,
              },
            },
          },
        },
        selectedEducationLevels: {
          include: { educationLevel: true },
        },
        selectedNationalities: {
          include: {
            country: true,
          },
        },
        selectedResidenceCountries: {
          include: {
            country: true,
          },
        },
        selectedCities: {
          include: {
            city: true,
          },
        },
        selectedPersonalityTypes: {
          include: { personalityType: true },
        },
        selectedZodiacSigns: {
          include: { zodiacSign: true },
        },
        selectedReligions: {
          include: { religion: true },
        },
      },
    });

    return NextResponse.json(
      {
        preference,
        isNew: !existingPreference, // true si on vient de la créer
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Error initializing preference:", error);
    return NextResponse.json(
      { error: "Failed to initialize preference" },
      { status: 500 },
    );
  }
}