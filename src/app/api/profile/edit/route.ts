// app/api/profile/edit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/profile/edit
 * 
 * Récupère les données du profil de l'utilisateur connecté pour l'édition
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database with full profile data
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

    if (!user.profil) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Return profile data formatted for editing
    return NextResponse.json({
      profile: user.profil,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching profile for edit:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}