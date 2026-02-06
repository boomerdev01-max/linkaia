import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { uploadProfilePhoto } from "@/lib/supabase/storage";

/**
 * POST /api/profile/upload-photo
 * 
 * Upload photo de profil vers Supabase Storage
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
        profil: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.profil) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get("photo") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload to Supabase Storage
    const photoUrl = await uploadProfilePhoto(file, user.id);

    // Update profile with photo URL
    const updatedProfile = await prisma.profil.update({
      where: { id: user.profil.id },
      data: {
        profilePhotoUrl: photoUrl,
      },
    });

    return NextResponse.json({
      photoUrl,
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error("❌ Error uploading photo:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload photo" },
      { status: 500 }
    );
  }
}