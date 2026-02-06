import { supabaseAdmin } from "./admin-client";

/**
 * 📄 Upload Company Registration Document to Supabase Storage
 */
export async function uploadCompanyDocument(
  file: File,
  userId: string,
): Promise<string> {
  try {
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop() || "pdf";
    const fileName = `${userId}/registration-${timestamp}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from("company-documents")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("❌ Error uploading document:", error);
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("company-documents").getPublicUrl(fileName);

    console.log(`✅ Document uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("❌ Failed to upload company document:", error);
    throw error;
  }
}

/**
 * 🎨 Upload Company Logo to Supabase Storage
 */
export async function uploadCompanyLogo(
  file: File,
  userId: string,
): Promise<string> {
  try {
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop() || "png";
    const fileName = `${userId}/logo-${timestamp}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from("company-logos")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("❌ Error uploading logo:", error);
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("company-logos").getPublicUrl(fileName);

    console.log(`✅ Logo uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("❌ Failed to upload company logo:", error);
    throw error;
  }
}

/**
 * 🗑️ Delete Company Document
 */
export async function deleteCompanyDocument(
  documentUrl: string,
  userId: string,
): Promise<void> {
  try {
    const urlParts = documentUrl.split("/company-documents/");
    if (urlParts.length !== 2) {
      throw new Error("Invalid document URL format.");
    }

    const filePath = urlParts[1];

    if (!filePath.startsWith(userId)) {
      throw new Error(
        "Unauthorized: Cannot delete another company's document.",
      );
    }

    const { error } = await supabaseAdmin.storage
      .from("company-documents")
      .remove([filePath]);

    if (error) {
      console.error("❌ Error deleting document:", error);
      throw error;
    }

    console.log(`✅ Document deleted: ${filePath}`);
  } catch (error) {
    console.error("❌ Failed to delete company document:", error);
    throw error;
  }
}

/**
 * 🗑️ Delete Company Logo
 */
export async function deleteCompanyLogo(
  logoUrl: string,
  userId: string,
): Promise<void> {
  try {
    const urlParts = logoUrl.split("/company-logos/");
    if (urlParts.length !== 2) {
      throw new Error("Invalid logo URL format.");
    }

    const filePath = urlParts[1];

    if (!filePath.startsWith(userId)) {
      throw new Error("Unauthorized: Cannot delete another company's logo.");
    }

    const { error } = await supabaseAdmin.storage
      .from("company-logos")
      .remove([filePath]);

    if (error) {
      console.error("❌ Error deleting logo:", error);
      throw error;
    }

    console.log(`✅ Logo deleted: ${filePath}`);
  } catch (error) {
    console.error("❌ Failed to delete company logo:", error);
    throw error;
  }
}
