// src/app/api/preference/init/route.ts
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
            selectedInterests: {
              include: {
                interest: {
                  include: {
                    category: true,
                  },
                },
              },
            },
            selectedNationalities: {
              include: {
                nationality: true,
              },
            },
            selectedCities: {
              include: {
                city: true,
              },
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
          selectedInterests: {
            include: {
              interest: {
                include: {
                  category: true,
                },
              },
            },
          },
          selectedNationalities: {
            include: {
              nationality: true,
            },
          },
          selectedCities: {
            include: {
              city: true,
            },
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
      { status: 500 }
    );
  }
}