// app/api/posts/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import {
  uploadPostPhoto,
  uploadPostVideo,
} from "@/lib/supabase/post-media-storage";

/**
 * POST /api/posts/create
 * Crée un nouveau post avec texte et/ou médias
 *
 * Body (FormData):
 * - content: string (optionnel si médias présents)
 * - visibility: "public" | "friends" | "private"
 * - photos: File[] (max 10 photos)
 * - video: File (max 1 vidéo)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur depuis Prisma
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Parser le FormData
    const formData = await request.formData();
    const content = formData.get("content") as string | null;
    const visibility = (formData.get("visibility") as string) || "public";

    // Valider que le post contient au moins du texte ou des médias
    const photos = formData.getAll("photos") as File[];
    const video = formData.get("video") as File | null;

    if (!content && photos.length === 0 && !video) {
      return NextResponse.json(
        {
          success: false,
          error: "Le post doit contenir du texte ou des médias",
        },
        { status: 400 }
      );
    }

    // Valider les limites
    if (photos.length > 10) {
      return NextResponse.json(
        { success: false, error: "Maximum 10 photos par post" },
        { status: 400 }
      );
    }

    // Ne pas permettre de mixer photos et vidéo
    if (photos.length > 0 && video) {
      return NextResponse.json(
        { success: false, error: "Impossible de mixer photos et vidéo" },
        { status: 400 }
      );
    }

    // Créer le post
    const post = await prisma.post.create({
      data: {
        content: content || null,
        visibility,
        authorId: user.id,
      },
    });

    // Upload des photos
    const uploadedPhotos: Array<{
      url: string;
      type: string;
      mimeType: string;
      size: number;
      order: number;
    }> = [];

    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        try {
          const photoUrl = await uploadPostPhoto(photo, user.id, post.id);
          uploadedPhotos.push({
            url: photoUrl,
            type: "photo",
            mimeType: photo.type,
            size: photo.size,
            order: i,
          });
        } catch (error) {
          console.error(`❌ Failed to upload photo ${i}:`, error);
          // Continue avec les autres photos même si une échoue
        }
      }
    }

    // Upload de la vidéo
    let uploadedVideo: {
      url: string;
      type: string;
      mimeType: string;
      size: number;
      order: number;
    } | null = null;

    if (video) {
      try {
        const videoUrl = await uploadPostVideo(video, user.id, post.id);
        uploadedVideo = {
          url: videoUrl,
          type: "video",
          mimeType: video.type,
          size: video.size,
          order: 0,
        };
      } catch (error) {
        console.error("❌ Failed to upload video:", error);
        return NextResponse.json(
          { success: false, error: "Échec de l'upload de la vidéo" },
          { status: 500 }
        );
      }
    }

    // Créer les entrées PostMedia
    const mediaToCreate = [...uploadedPhotos];
    if (uploadedVideo) {
      mediaToCreate.push(uploadedVideo);
    }

    if (mediaToCreate.length > 0) {
      await prisma.postMedia.createMany({
        data: mediaToCreate.map((media) => ({
          postId: post.id,
          url: media.url,
          type: media.type,
          mimeType: media.mimeType,
          size: media.size,
          order: media.order,
        })),
      });
    }

    // Récupérer le post complet avec relations
    const completePost = await prisma.post.findUnique({
      where: { id: post.id },
      include: {
        author: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            profil: {
              select: {
                pseudo: true,
                profilePhotoUrl: true,
              },
            },
          },
        },
        media: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Post créé avec succès",
      data: completePost,
    });
  } catch (error) {
    console.error("❌ Error creating post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create post" },
      { status: 500 }
    );
  }
}
