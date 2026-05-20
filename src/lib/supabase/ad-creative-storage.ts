// src/lib/supabase/ad-creative-storage.ts
// 🎨 Gestion optimisée des images créatives publicitaires dans Supabase Storage

import { supabaseAdmin } from "./admin-client";

// Constantes de configuration
const BUCKET_NAME = "ad-creatives";
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

/**
 * Valide le fichier image avant upload
 * @throws {Error} Si le fichier ne respecte pas les critères
 */
function validateImageFile(file: File): void {
  // Vérification du type MIME
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    throw new Error(
      `Type de fichier invalide. Formats acceptés : ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  // Vérification de la taille
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `L'image dépasse la limite de ${MAX_FILE_SIZE / (1024 * 1024)}MB. ` +
      `Taille actuelle : ${(file.size / (1024 * 1024)).toFixed(2)}MB`
    );
  }

  // Vérification supplémentaire : fichier vide
  if (file.size === 0) {
    throw new Error("Le fichier est vide.");
  }
}

/**
 * Extrait et valide l'extension du fichier
 */
function getFileExtension(file: File, fallbackExt: string = "png"): string {
  const originalExt = file.name.split(".").pop()?.toLowerCase();
  
  if (!originalExt) {
    console.warn(`⚠️ Extension manquante pour ${file.name}, utilisation de ${fallbackExt}`);
    return fallbackExt;
  }
  
  // Vérifier que l'extension correspond au type MIME
  const isJpeg = file.type === "image/jpeg" && ["jpg", "jpeg"].includes(originalExt);
  const isValidExt = ALLOWED_EXTENSIONS.includes(originalExt);
  
  if (!isValidExt && !isJpeg) {
    console.warn(`⚠️ Extension ${originalExt} non standard pour type ${file.type}, utilisation de ${fallbackExt}`);
    return fallbackExt;
  }
  
  return originalExt;
}

/**
 * 📤 Upload d'une image créative publicitaire
 * 
 * @param file - Fichier image (JPEG, PNG, WEBP max 3MB)
 * @param userId - ID de l'annonceur
 * @param campaignId - ID de la campagne
 * @returns URL publique de l'image uploadée
 * 
 * @example
 * const imageUrl = await uploadAdCreativeImage(file, "user123", "campaign456");
 */
export async function uploadAdCreativeImage(
  file: File,
  userId: string,
  campaignId: string,
): Promise<string> {
  try {
    // Validation des paramètres
    if (!userId || !campaignId) {
      throw new Error("userId et campaignId sont requis");
    }
    
    // Validation du fichier
    validateImageFile(file);
    
    // Préparation du nom de fichier
    const timestamp = Date.now();
    const fileExt = getFileExtension(file);
    const fileName = `${userId}/${campaignId}/creative-${timestamp}.${fileExt}`;
    
    // Conversion pour upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload vers Supabase
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: "3600", // Cache CDN 1 heure
      });
    
    if (error) {
      console.error("❌ Erreur technique lors de l'upload:", error);
      throw new Error(`Échec de l'upload: ${error.message}`);
    }
    
    // Récupération de l'URL publique
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    
    console.log(`✅ Image uploadée avec succès : ${publicUrl}`);
    console.log(`📊 Métadonnées - User: ${userId}, Campaign: ${campaignId}, Size: ${(file.size / 1024).toFixed(2)}KB`);
    
    return publicUrl;
    
  } catch (error) {
    // Enrichissement du message d'erreur
    if (error instanceof Error) {
      console.error("❌ Échec de l'upload créatif:", error.message);
      throw error;
    }
    console.error("❌ Erreur inattendue lors de l'upload:", error);
    throw new Error("Une erreur inattendue est survenue lors de l'upload");
  }
}

/**
 * 🗑️ Suppression d'une image créative publicitaire
 * 
 * @param imageUrl - URL publique complète de l'image
 * @param userId - ID de l'annonceur (validation de propriété)
 * @throws {Error} Si l'URL est invalide ou l'utilisateur non autorisé
 * 
 * @example
 * await deleteAdCreativeImage(imageUrl, "user123");
 */
export async function deleteAdCreativeImage(
  imageUrl: string,
  userId: string,
): Promise<void> {
  try {
    // Validation des paramètres
    if (!imageUrl || !userId) {
      throw new Error("imageUrl et userId sont requis");
    }
    
    // Extraction robuste du chemin fichier
    let filePath: string;
    
    // Méthode 1: Découpage par bucket (plus fiable)
    const bucketPattern = `/${BUCKET_NAME}/`;
    const urlParts = imageUrl.split(bucketPattern);
    
    if (urlParts.length === 2) {
      filePath = urlParts[1];
      // Supprimer d'éventuels query parameters
      filePath = filePath.split("?")[0];
    } else {
      // Méthode 2: Fallback - extraction par pattern générique
      const match = imageUrl.match(new RegExp(`${BUCKET_NAME}/(.+)$`));
      if (!match) {
        throw new Error(
          `Format d'URL invalide. Impossible d'extraire le chemin depuis: ${imageUrl}`
        );
      }
      filePath = match[1].split("?")[0];
    }
    
    // Validation de sécurité : vérifier que l'utilisateur est propriétaire
    if (!filePath.startsWith(userId)) {
      throw new Error(
        `Non autorisé : l'utilisateur ${userId} ne peut pas supprimer l'image ${filePath}`
      );
    }
    
    // Suppression dans Supabase
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([filePath]);
    
    if (error) {
      console.error("❌ Erreur technique lors de la suppression:", error);
      throw new Error(`Échec de la suppression: ${error.message}`);
    }
    
    console.log(`✅ Image supprimée avec succès : ${filePath}`);
    console.log(`👤 Supprimée par l'utilisateur: ${userId}`);
    
  } catch (error) {
    // Enrichissement du message d'erreur
    if (error instanceof Error) {
      console.error("❌ Échec de la suppression créative:", error.message);
      throw error;
    }
    console.error("❌ Erreur inattendue lors de la suppression:", error);
    throw new Error("Une erreur inattendue est survenue lors de la suppression");
  }
}

/**
 * 🔍 Vérifie si une image créative existe dans le storage
 * 
 * @param filePath - Chemin complet du fichier dans le bucket
 * @returns boolean indiquant si l'image existe
 */
export async function adCreativeExists(filePath: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(filePath.split("/").slice(0, -1).join("/"), {
        limit: 1,
        search: filePath.split("/").pop(),
      });
    
    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error("❌ Erreur lors de la vérification d'existence:", error);
    return false;
  }
}

/**
 * 📊 Obtenir les métadonnées d'une image créative
 * 
 * @param imageUrl - URL publique de l'image
 * @returns Métadonnées de l'image ou null si non trouvée
 */
export async function getAdCreativeMetadata(imageUrl: string): Promise<{
  size: number;
  lastModified: string;
  mimeType: string;
} | null> {
  try {
    const bucketPattern = `/${BUCKET_NAME}/`;
    const urlParts = imageUrl.split(bucketPattern);
    
    if (urlParts.length !== 2) {
      throw new Error("Format d'URL invalide");
    }
    
    const filePath = urlParts[1].split("?")[0];
    
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(filePath.split("/").slice(0, -1).join("/"), {
        limit: 1,
        search: filePath.split("/").pop(),
      });
    
    if (error || !data || data.length === 0) {
      return null;
    }
    
    const file = data[0];
    return {
      size: file.metadata?.size || 0,
      lastModified: file.updated_at || new Date().toISOString(),
      mimeType: file.metadata?.mimetype || "image/unknown",
    };
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des métadonnées:", error);
    return null;
  }
}