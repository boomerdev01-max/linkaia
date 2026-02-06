import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/profile/init
 * 
 * Initialise le profil d'un utilisateur
 * Appelé au premier chargement de la page onboarding
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: {
        profil: {
          include: {
            interests: {
              include: {
                interest: {
                  include: {
                    category: true,
                  },
                },
              },
            },
            nationalites: {
              include: {
                nationality: true,
              },
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If profile doesn't exist, create it
    if (!user.profil) {
      const newProfile = await prisma.profil.create({
        data: {
          userId: user.id,
        },
        include: {
          interests: {
            include: {
              interest: {
                include: {
                  category: true,
                },
              },
            },
          },
          nationalites: {
            include: {
              nationality: true,
            },
          },
        },
      });

      return NextResponse.json({
        profile: newProfile,
        isNew: true,
      });
    }

    // Return existing profile
    return NextResponse.json({
      profile: user.profil,
      isNew: false,
    });
  } catch (error) {
    console.error("❌ Error initializing profile:", error);
    return NextResponse.json(
      { error: "Failed to initialize profile" },
      { status: 500 }
    );
  }
}