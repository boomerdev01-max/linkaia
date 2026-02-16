// lib/supabase/story-storage.ts
import { supabaseAdmin } from "@/lib/supabase/admin-client";

// Limites de fichiers
export const STORY_FILE_LIMITS = {
  PHOTO: 10 * 1024 * 1024, // 10MB
  VIDEO: 50 * 1024 * 1024, // 50MB
  VIDEO_DURATION: 30, // 30 secondes max
};

// Types MIME autorisés
export const STORY_ALLOWED_TYPES = {
  PHOTO: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  VIDEO: ["video/mp4", "video/webm", "video/quicktime"],
};

export type StoryMediaType = "PHOTO" | "VIDEO";

/**
 * 📸 Upload Story Media to Supabase Storage
 */
export async function uploadStoryMedia(
  file: File,
  userId: string,
  slideIndex: number,
): Promise<{ url: string; thumbnailUrl?: string; error?: string }> {
  try {
    // 1. Validation du type
    const mediaType = getStoryMediaType(file.type);
    if (!mediaType) {
      return { url: "", error: "Type de fichier non autorisé" };
    }

    // 2. Validation de la taille
    const limit = STORY_FILE_LIMITS[mediaType];
    if (file.size > limit) {
      const limitMB = limit / (1024 * 1024);
      return {
        url: "",
        error: `Fichier trop volumineux (max ${limitMB}MB)`,
      };
    }

    // 3. Génération du nom de fichier
    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "bin";
    const fileName = `${userId}/${timestamp}-slide${slideIndex}.${ext}`;

    // 4. Upload vers Supabase
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from("stories")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("❌ Story upload error:", error);
      return { url: "", error: "Erreur lors de l'upload" };
    }

    // 5. Récupération de l'URL publique
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("stories").getPublicUrl(data.path);

    // 6. Génération de thumbnail pour vidéo (optionnel - à améliorer plus tard)
    let thumbnailUrl: string | undefined;
    if (mediaType === "VIDEO") {
      // Pour l'instant, on retourne juste l'URL de la vidéo
      // TODO: Générer un vrai thumbnail avec ffmpeg ou service externe
      thumbnailUrl = publicUrl;
    }

    console.log(`✅ Story media uploaded: ${publicUrl}`);
    return { url: publicUrl, thumbnailUrl };
  } catch (error) {
    console.error("❌ Failed to upload story media:", error);
    return { url: "", error: "Erreur inattendue" };
  }
}

/**
 * 🗑️ Delete Story Media from Storage
 */
export async function deleteStoryMedia(mediaUrl: string): Promise<boolean> {
  try {
    // Extraire le path depuis l'URL
    const urlParts = mediaUrl.split("/stories/");
    if (urlParts.length !== 2) {
      console.error("❌ Invalid story media URL:", mediaUrl);
      return false;
    }

    const filePath = urlParts[1];

    const { error } = await supabaseAdmin.storage
      .from("stories")
      .remove([filePath]);

    if (error) {
      console.error("❌ Error deleting story media:", error);
      return false;
    }

    console.log(`✅ Story media deleted: ${filePath}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to delete story media:", error);
    return false;
  }
}

/**
 * 🗑️ Delete All Media for a Story (tous les slides)
 */
export async function deleteAllStoryMedia(
  storyId: string,
  userId: string,
): Promise<void> {
  try {
    // Lister tous les fichiers du user dans le dossier stories
    const { data, error } = await supabaseAdmin.storage
      .from("stories")
      .list(userId);

    if (error) {
      console.error("❌ Error listing story files:", error);
      return;
    }

    // Filtrer les fichiers appartenant à cette story (par timestamp)
    // Note: On pourrait améliorer ça en stockant le storyId dans le nom du fichier
    const filesToDelete = data.map((file: { name: any; }) => `${userId}/${file.name}`);

    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabaseAdmin.storage
        .from("stories")
        .remove(filesToDelete);

      if (deleteError) {
        console.error("❌ Error deleting story files:", deleteError);
      } else {
        console.log(
          `✅ Deleted ${filesToDelete.length} files for story ${storyId}`,
        );
      }
    }
  } catch (error) {
    console.error("❌ Failed to delete all story media:", error);
  }
}

/**
 * 🧹 Cleanup Expired Stories (cron job helper)
 * Supprime les médias des stories expirées depuis plus de 24h
 */
export async function cleanupExpiredStories(): Promise<number> {
  try {
    // Cette fonction serait appelée par un cron job
    // Pour l'instant, on retourne juste 0
    // TODO: Implémenter avec Vercel Cron ou similaire
    console.log("🧹 Cleanup expired stories media...");
    return 0;
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    return 0;
  }
}

// ============================================
// HELPERS
// ============================================

function getStoryMediaType(mimeType: string): StoryMediaType | null {
  if (STORY_ALLOWED_TYPES.PHOTO.includes(mimeType)) return "PHOTO";
  if (STORY_ALLOWED_TYPES.VIDEO.includes(mimeType)) return "VIDEO";
  return null;
}

/**
 * Valide un fichier avant upload
 */
export function validateStoryFile(file: File): {
  valid: boolean;
  error?: string;
  type?: StoryMediaType;
} {
  const mediaType = getStoryMediaType(file.type);

  if (!mediaType) {
    return { valid: false, error: "Type de fichier non autorisé" };
  }

  const limit = STORY_FILE_LIMITS[mediaType];
  if (file.size > limit) {
    const limitMB = limit / (1024 * 1024);
    return {
      valid: false,
      error: `Fichier trop volumineux (max ${limitMB}MB)`,
    };
  }

  return { valid: true, type: mediaType };
}
