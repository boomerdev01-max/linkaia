import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

const legalDetailsSchema = z.object({
  country: z.string().min(1, "Le pays est requis"),
  registrationType: z.enum([
    "ONG",
    "SARL",
    "SAS",
    "SASU",
    "EURL",
    "SA",
    "SNC",
    "SCS",
    "ASSOCIATION",
    "FONDATION",
    "GIE",
    "COOPERATIVE",
    "AUTO_ENTREPRENEUR",
    "OTHER",
  ]),
  legalRepresentative: z
    .string()
    .min(2, "Le représentant légal doit contenir au moins 2 caractères"),
  legalAddress: z
    .string()
    .min(5, "L'adresse légale doit contenir au moins 5 caractères"),
});

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

    // 3️⃣ VALIDER LES DONNÉES
    const body = await request.json();
    const validatedData = legalDetailsSchema.parse(body);

    // 4️⃣ METTRE À JOUR LE PROFIL ENTREPRISE
    const updatedProfile = await prisma.companyProfile.update({
      where: { userId: user.id },
      data: {
        country: validatedData.country,
        registrationType: validatedData.registrationType,
        legalRepresentative: validatedData.legalRepresentative,
        legalAddress: validatedData.legalAddress,
        isLegalDetailsCompleted: true,
      },
    });

    console.log(`✅ Legal details updated for company: ${user.id}`);

    return NextResponse.json({
      success: true,
      message: "Informations légales enregistrées avec succès",
      data: updatedProfile,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }

    console.error("❌ Legal details error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'enregistrement" },
      { status: 500 },
    );
  }
}
