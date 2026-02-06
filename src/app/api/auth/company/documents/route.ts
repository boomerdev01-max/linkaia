import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import {
  uploadCompanyDocument,
  uploadCompanyLogo,
} from "@/lib/supabase/company-storage";

export async function POST(request: Request) {
  try {
    // 1️⃣ VÉRIFIER L'AUTHENTIFICATION
    const { user, error } = await getAuthenticatedUser();

    if (!user || error) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // 2️⃣ VÉRIFIER QUE C'EST BIEN UN COMPTE ENTREPRISE
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { companyProfile: true },
    });

    if (!fullUser || fullUser.userType !== "COMPANY") {
      return NextResponse.json(
        { error: "Ce endpoint est réservé aux comptes entreprises" },
        { status: 403 },
      );
    }

    if (!fullUser.companyProfile) {
      return NextResponse.json(
        { error: "Profil entreprise introuvable" },
        { status: 404 },
      );
    }

    // 3️⃣ RÉCUPÉRER LES FICHIERS
    const formData = await request.formData();
    const registrationDocument = formData.get(
      "registrationDocument",
    ) as File | null;
    const logo = formData.get("logo") as File | null;

    if (!registrationDocument) {
      return NextResponse.json(
        { error: "Le document d'enregistrement est requis" },
        { status: 400 },
      );
    }

    // 4️⃣ UPLOAD DES FICHIERS
    let registrationDocumentUrl: string;
    let logoUrl: string | null = null;

    try {
      registrationDocumentUrl = await uploadCompanyDocument(
        registrationDocument,
        user.id,
      );
      console.log(
        `✅ Registration document uploaded: ${registrationDocumentUrl}`,
      );

      if (logo) {
        logoUrl = await uploadCompanyLogo(logo, user.id);
        console.log(`✅ Logo uploaded: ${logoUrl}`);
      }
    } catch (uploadError) {
      console.error("❌ Upload error:", uploadError);
      return NextResponse.json(
        { error: "Erreur lors de l'upload des fichiers" },
        { status: 500 },
      );
    }

    // 5️⃣ METTRE À JOUR LE PROFIL ENTREPRISE
    const updatedProfile = await prisma.companyProfile.update({
      where: { userId: user.id },
      data: {
        registrationDocumentUrl,
        logoUrl,
        isDocumentsCompleted: true,
      },
    });

    console.log(`✅ Documents uploaded for company: ${user.id}`);

    return NextResponse.json({
      success: true,
      message: "Documents enregistrés avec succès",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("❌ Documents upload error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'upload" },
      { status: 500 },
    );
  }
}
