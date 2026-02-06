import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/profile/skip
 *
 * Marque que l'utilisateur a choisi de skip le setup du profil
 * Met skipProfileSetup à true dans User et redirige vers /home
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    // Update user to mark profile setup as skipped
    await prisma.user.update({
      where: { id: user.id },
      data: {
        skipProfileSetup: true,
      },
    });

    console.log(`✅ User ${user.id} skipped profile setup`);

    // ✅ CORRECTION : Rediriger vers /home au lieu de renvoyer du JSON
    return NextResponse.redirect(new URL("/home", request.url));
  } catch (error) {
    console.error("❌ Error skipping profile setup:", error);
    // En cas d'erreur, rediriger quand même vers /home
    return NextResponse.redirect(new URL("/home", request.url));
  }
}
