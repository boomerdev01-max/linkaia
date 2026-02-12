// src/app/api/preference/init/route.ts - VERSION CORRIGÉE
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: {
        preference: {
          include: {
            // ✅ RELATIONS MANY-TO-MANY CORRIGÉES
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
                country: true, // ✅ FIXÉ : "country" au lieu de "nationality"
              },
            },
            selectedResidenceCountries: {
              include: {
                country: true, // ✅ FIXÉ
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
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Si preference n'existe pas, la créer
    if (!user.preference) {
      const newPreference = await prisma.preference.create({
        data: {
          userId: user.id,
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

      return NextResponse.json({
        preference: newPreference,
        isNew: true,
      });
    }

    return NextResponse.json({
      preference: user.preference,
      isNew: false,
    });
  } catch (error) {
    console.error("❌ Error initializing preference:", error);
    return NextResponse.json(
      { error: "Failed to initialize preference" },
      { status: 500 },
    );
  }
}
