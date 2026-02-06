// lib/supabase/post-media-storage.ts
import { supabaseAdmin } from "./admin-client";

/**
 * 📸 Upload Post Photo to Supabase Storage
 *
 * @param file - File object (from FormData)
 * @param userId - User ID for folder organization
 * @param postId - Post ID for organization
 * @returns Public URL of uploaded photo
 */
export async function uploadPostPhoto(
  file: File,
  userId: string,
  postId: string
): Promise<string> {
  try {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed."
      );
    }

    // Validate file size (max 5MB for photos)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit.");
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${postId}/photo-${Date.now()}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("post-photos")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false, // Don't replace if exists
      });

    if (error) {
      console.error("❌ Error uploading photo:", error);
      throw error;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("post-photos").getPublicUrl(fileName);

    console.log(`✅ Photo uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("❌ Failed to upload post photo:", error);
    throw error;
  }
}

/**
 * 🎥 Upload Post Video to Supabase Storage
 *
 * @param file - File object (from FormData)
 * @param userId - User ID for folder organization
 * @param postId - Post ID for organization
 * @returns Public URL of uploaded video
 */
export async function uploadPostVideo(
  file: File,
  userId: string,
  postId: string
): Promise<string> {
  try {
    // Validate file type
    const validTypes = [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/webm",
    ];
    if (!validTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only MP4, MOV, AVI, and WEBM are allowed."
      );
    }

    // Validate file size (max 50MB for videos)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      throw new Error("File size exceeds 50MB limit.");
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${postId}/video-${Date.now()}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("post-videos")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("❌ Error uploading video:", error);
      throw error;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("post-videos").getPublicUrl(fileName);

    console.log(`✅ Video uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("❌ Failed to upload post video:", error);
    throw error;
  }
}

/**
 * 🗑️ Delete Post Photo from Supabase Storage
 *
 * @param photoUrl - Full URL of the photo to delete
 * @param userId - User ID for validation
 */
export async function deletePostPhoto(
  photoUrl: string,
  userId: string
): Promise<void> {
  try {
    // Extract file path from URL
    // Format: https://<project>.supabase.co/storage/v1/object/public/post-photos/<path>
    const urlParts = photoUrl.split("/post-photos/");
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
      .from("post-photos")
      .remove([filePath]);

    if (error) {
      console.error("❌ Error deleting photo:", error);
      throw error;
    }

    console.log(`✅ Photo deleted: ${filePath}`);
  } catch (error) {
    console.error("❌ Failed to delete post photo:", error);
    throw error;
  }
}

/**
 * 🗑️ Delete Post Video from Supabase Storage
 *
 * @param videoUrl - Full URL of the video to delete
 * @param userId - User ID for validation
 */
export async function deletePostVideo(
  videoUrl: string,
  userId: string
): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = videoUrl.split("/post-videos/");
    if (urlParts.length !== 2) {
      throw new Error("Invalid video URL format.");
    }

    const filePath = urlParts[1];

    // Validate that the file belongs to the user
    if (!filePath.startsWith(userId)) {
      throw new Error("Unauthorized: Cannot delete another user's video.");
    }

    // Delete from storage
    const { error } = await supabaseAdmin.storage
      .from("post-videos")
      .remove([filePath]);

    if (error) {
      console.error("❌ Error deleting video:", error);
      throw error;
    }

    console.log(`✅ Video deleted: ${filePath}`);
  } catch (error) {
    console.error("❌ Failed to delete post video:", error);
    throw error;
  }
}

/**
 * 📂 List all media for a specific post
 *
 * @param userId - User ID
 * @param postId - Post ID
 * @returns Object with arrays of photo and video URLs
 */
export async function listPostMedia(
  userId: string,
  postId: string
): Promise<{ photos: string[]; videos: string[] }> {
  try {
    const folderPath = `${userId}/${postId}`;

    // List photos
    const { data: photoData, error: photoError } = await supabaseAdmin.storage
      .from("post-photos")
      .list(folderPath);

    if (photoError) {
      console.error("❌ Error listing photos:", photoError);
    }

    // List videos
    const { data: videoData, error: videoError } = await supabaseAdmin.storage
      .from("post-videos")
      .list(folderPath);

    if (videoError) {
      console.error("❌ Error listing videos:", videoError);
    }

    // Get public URLs for photos
    const photoUrls =
      photoData?.map((file) => {
        const {
          data: { publicUrl },
        } = supabaseAdmin.storage
          .from("post-photos")
          .getPublicUrl(`${folderPath}/${file.name}`);
        return publicUrl;
      }) || [];

    // Get public URLs for videos
    const videoUrls =
      videoData?.map((file) => {
        const {
          data: { publicUrl },
        } = supabaseAdmin.storage
          .from("post-videos")
          .getPublicUrl(`${folderPath}/${file.name}`);
        return publicUrl;
      }) || [];

    return {
      photos: photoUrls,
      videos: videoUrls,
    };
  } catch (error) {
    console.error("❌ Failed to list post media:", error);
    throw error;
  }
}

/**
 * 🗑️ Delete all media for a post (when post is deleted)
 *
 * @param userId - User ID
 * @param postId - Post ID
 */
export async function deleteAllPostMedia(
  userId: string,
  postId: string
): Promise<void> {
  try {
    const folderPath = `${userId}/${postId}`;

    // List and delete photos
    const { data: photoData } = await supabaseAdmin.storage
      .from("post-photos")
      .list(folderPath);

    if (photoData && photoData.length > 0) {
      const photoPaths = photoData.map((file) => `${folderPath}/${file.name}`);
      await supabaseAdmin.storage.from("post-photos").remove(photoPaths);
      console.log(`✅ Deleted ${photoPaths.length} photos`);
    }

    // List and delete videos
    const { data: videoData } = await supabaseAdmin.storage
      .from("post-videos")
      .list(folderPath);

    if (videoData && videoData.length > 0) {
      const videoPaths = videoData.map((file) => `${folderPath}/${file.name}`);
      await supabaseAdmin.storage.from("post-videos").remove(videoPaths);
      console.log(`✅ Deleted ${videoPaths.length} videos`);
    }

    console.log(`✅ All media deleted for post: ${postId}`);
  } catch (error) {
    console.error("❌ Failed to delete all post media:", error);
    throw error;
  }
}
