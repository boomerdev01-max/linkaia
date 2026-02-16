// src/app/api/stories/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { uploadStoryMedia, validateStoryFile } from "@/lib/story-storage";

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    const auth = await requireAuth();
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(auth.errorResponse, { status: auth.status });
    }

    // 2. Récupérer le FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const slideIndex = parseInt(formData.get("slideIndex") as string) || 0;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni" },
        { status: 400 },
      );
    }

    // 3. Validation du fichier
    const validation = validateStoryFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }

    // 4. Upload vers Supabase Storage
    const result = await uploadStoryMedia(file, auth.user.id, slideIndex);

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }

    // 5. Retourner les URLs
    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        type: validation.type,
        mimeType: file.type,
      },
    });
  } catch (error) {
    console.error("❌ Story upload error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'upload" },
      { status: 500 },
    );
  }
}
