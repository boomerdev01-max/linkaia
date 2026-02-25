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

    // 3️⃣ NETTOYAGE : Supprimer les doublons s'ils existent
    // On garde uniquement la première préférence (la plus ancienne)
    const duplicatePreferences = await prisma.preference.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    if (duplicatePreferences.length > 1) {
      console.log(
        `🧹 Nettoyage : ${duplicatePreferences.length - 1} préférences en double pour l'utilisateur ${userId}`,
      );

      // Garder la première, supprimer les autres
      const [first, ...rest] = duplicatePreferences;
      await prisma.preference.deleteMany({
        where: {
          id: { in: rest.map((p) => p.id) },
        },
      });
    }

    // 4️⃣ Maintenant on peut faire l'upsert en toute sécurité
    const preference = await prisma.preference.upsert({
      where: { userId },
      update: {}, // rien à mettre pour l'init
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
        isNew: duplicatePreferences.length === 0, // true si on vient de la créer
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
