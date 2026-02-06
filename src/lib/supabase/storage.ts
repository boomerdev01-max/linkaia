import { supabaseAdmin } from "./admin-client";

/**
 * 📸 Upload Profile Photo to Supabase Storage
 * 
 * @param file - File object (from FormData)
 * @param userId - User ID for folder organization
 * @returns Public URL of uploaded photo
 */
export async function uploadProfilePhoto(
  file: File,
  userId: string
): Promise<string> {
  try {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit.");
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/profile-${Date.now()}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("profile-photos")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true, // Replace if exists
      });

    if (error) {
      console.error("❌ Error uploading photo:", error);
      throw error;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("profile-photos").getPublicUrl(fileName);

    console.log(`✅ Photo uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("❌ Failed to upload profile photo:", error);
    throw error;
  }
}

/**
 * 🗑️ Delete Profile Photo from Supabase Storage
 * 
 * @param photoUrl - Full URL of the photo to delete
 * @param userId - User ID for validation
 */
export async function deleteProfilePhoto(
  photoUrl: string,
  userId: string
): Promise<void> {
  try {
    // Extract file path from URL
    // Format: https://<project>.supabase.co/storage/v1/object/public/profile-photos/<path>
    const urlParts = photoUrl.split("/profile-photos/");
    if (urlParts.length !== 2) {
      throw new Error("Invalid photo URL format.");
    }

    const filePath = urlParts[1];

    // Validate that the file belongs to the user
    if (!filePath.startsWith(userId)) {
      throw new Error("Unauthorized: Cannot delete another user's photo.");
    }

    // Delete from storage
    const { error } = await supabaseAdmin.storage
      .from("profile-photos")
      .remove([filePath]);

    if (error) {
      console.error("❌ Error deleting photo:", error);
      throw error;
    }

    console.log(`✅ Photo deleted: ${filePath}`);
  } catch (error) {
    console.error("❌ Failed to delete profile photo:", error);
    throw error;
  }
}

/**
 * 📂 List all photos for a user
 * 
 * @param userId - User ID
 * @returns Array of photo URLs
 */
export async function listUserPhotos(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from("profile-photos")
      .list(userId);

    if (error) {
      console.error("❌ Error listing photos:", error);
      throw error;
    }

    // Get public URLs for all photos
    const photoUrls = data.map((file) => {
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage
        .from("profile-photos")
        .getPublicUrl(`${userId}/${file.name}`);
      return publicUrl;
    });

    return photoUrls;
  } catch (error) {
    console.error("❌ Failed to list user photos:", error);
    throw error;
  }
}