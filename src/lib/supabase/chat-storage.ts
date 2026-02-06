// lib/supabase/chat-storage.ts
// Server-side storage operations for chat media

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// File size limits in bytes
export const FILE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 50 * 1024 * 1024, // 50MB
  DOCUMENT: 20 * 1024 * 1024, // 20MB
  VOICE: 5 * 1024 * 1024, // 5MB
};

// Allowed MIME types
export const ALLOWED_TYPES = {
  IMAGE: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  VIDEO: ["video/mp4", "video/webm", "video/quicktime"],
  DOCUMENT: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],
  VOICE: ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg"],
};

export type MediaType = "IMAGE" | "VIDEO" | "DOCUMENT" | "VOICE";

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );
}

export function getMediaType(mimeType: string): MediaType | null {
  if (ALLOWED_TYPES.IMAGE.includes(mimeType)) return "IMAGE";
  if (ALLOWED_TYPES.VIDEO.includes(mimeType)) return "VIDEO";
  if (ALLOWED_TYPES.DOCUMENT.includes(mimeType)) return "DOCUMENT";
  if (ALLOWED_TYPES.VOICE.includes(mimeType)) return "VOICE";
  return null;
}

export function validateFile(file: File): {
  valid: boolean;
  error?: string;
  type?: MediaType;
} {
  const mediaType = getMediaType(file.type);

  if (!mediaType) {
    return { valid: false, error: "Type de fichier non autorise" };
  }

  const limit = FILE_LIMITS[mediaType];
  if (file.size > limit) {
    const limitMB = limit / (1024 * 1024);
    return {
      valid: false,
      error: `Fichier trop volumineux (max ${limitMB}MB)`,
    };
  }

  return { valid: true, type: mediaType };
}

export async function uploadChatMedia(
  file: File,
  conversationId: string,
  userId: string,
): Promise<{ url: string; path: string } | { error: string }> {
  const validation = validateFile(file);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  const supabase = await getSupabaseClient();
  const bucket = validation.type === "VOICE" ? "voice-messages" : "chat-media";

  const timestamp = Date.now();
  const ext = file.name.split(".").pop() || "bin";
  const path = `${userId}/${conversationId}/${timestamp}.${ext}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return { error: "Erreur lors du telechargement" };
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, path: data.path };
}

export async function deleteChatMedia(
  path: string,
  bucket: "chat-media" | "voice-messages",
) {
  const supabase = await getSupabaseClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error("Delete error:", error);
    return false;
  }

  return true;
}
