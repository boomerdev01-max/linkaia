// app/api/auth/company/org-profile/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

const donorSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default("XOF"),
  year: z.number().int().min(2000).max(new Date().getFullYear()),
});

// ✅ FIX : pas de .url() — les champs peuvent être vides ou null
// La validation URL est déjà assurée par type="url" côté HTML
const socialMediaSchema = z
  .object({
    website: z.string().optional().nullable(),
    linkedin: z.string().optional().nullable(),
    facebook: z.string().optional().nullable(),
    twitter: z.string().optional().nullable(),
    instagram: z.string().optional().nullable(),
    youtube: z.string().optional().nullable(),
  })
  .optional()
  .nullable();

const orgProfileSchema = z.object({
  // Chiffres clés
  annualBudget: z.number().positive().optional().nullable(),
  annualBudgetCurrency: z.string().optional().nullable(),
  fullTimeStaff: z.number().int().min(0).optional().nullable(),
  womenCount: z.number().int().min(0).optional().nullable(),
  womenInLeadershipPercent: z.number().min(0).max(100).optional().nullable(),

  // Mission & Projets
  mainMission: z.string().max(2000).optional().nullable(),
  projectsDescription: z.string().max(3000).optional().nullable(),
  recentAccomplishments: z.string().max(2000).optional().nullable(),
  beneficiaries: z.string().max(1000).optional().nullable(),

  // Financement
  mainDonors: z.array(donorSchema).max(20).optional().nullable(),
  mainUnrestrictedFundPriority: z.string().max(1000).optional().nullable(),
  resourceMobilizationTeam: z.boolean().optional().nullable(),

  // Présence numérique
  socialMediaPresence: socialMediaSchema,

  // Skip flag
  skip: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = orgProfileSchema.parse(body);

    // Récupérer l'utilisateur avec son profil entreprise
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: { companyProfile: true },
    });

    if (!user || !user.companyProfile) {
      return NextResponse.json(
        { error: "Profil entreprise introuvable" },
        { status: 404 },
      );
    }

    if (!user.companyProfile.isDocumentsCompleted) {
      return NextResponse.json(
        { error: "Veuillez d'abord compléter les étapes précédentes" },
        { status: 400 },
      );
    }

    // Si skip demandé
    if (validatedData.skip) {
      await prisma.companyProfile.update({
        where: { userId: user.id },
        data: {
          skipOrgProfileSetup: true,
          isOrgProfileCompleted: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Étape ignorée avec succès",
        redirectTo: "/home",
      });
    }

    // Nettoyer les URLs vides dans socialMediaPresence
    let cleanedSocialMedia: Record<string, string> | null = null;
    if (validatedData.socialMediaPresence) {
      const cleaned: Record<string, string> = {};
      for (const [key, value] of Object.entries(
        validatedData.socialMediaPresence,
      )) {
        if (value && value.trim() !== "") {
          cleaned[key] = value.trim();
        }
      }
      cleanedSocialMedia = Object.keys(cleaned).length > 0 ? cleaned : null;
    }

    // Mise à jour du profil
    await prisma.companyProfile.update({
      where: { userId: user.id },
      data: {
        annualBudget: validatedData.annualBudget ?? null,
        annualBudgetCurrency: validatedData.annualBudgetCurrency ?? "XOF",
        fullTimeStaff: validatedData.fullTimeStaff ?? null,
        womenCount: validatedData.womenCount ?? null,
        womenInLeadershipPercent:
          validatedData.womenInLeadershipPercent ?? null,
        mainMission: validatedData.mainMission ?? null,
        projectsDescription: validatedData.projectsDescription ?? null,
        recentAccomplishments: validatedData.recentAccomplishments ?? null,
        beneficiaries: validatedData.beneficiaries ?? null,
        mainDonors: validatedData.mainDonors ?? undefined,
        mainUnrestrictedFundPriority:
          validatedData.mainUnrestrictedFundPriority ?? null,
        resourceMobilizationTeam:
          validatedData.resourceMobilizationTeam ?? null,
        socialMediaPresence: cleanedSocialMedia ?? undefined,
        isOrgProfileCompleted: true,
        skipOrgProfileSetup: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profil organisation complété avec succès",
      redirectTo: "/home",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ [ORG-PROFILE] Zod validation error:", error.issues);
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }

    console.error("❌ [ORG-PROFILE] Error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 },
    );
  }
}

// GET : récupérer les données existantes (pour pré-remplir le formulaire)
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: { companyProfile: true },
    });

    if (!user || !user.companyProfile) {
      return NextResponse.json(
        { error: "Profil entreprise introuvable" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        annualBudget: user.companyProfile.annualBudget,
        annualBudgetCurrency: user.companyProfile.annualBudgetCurrency,
        fullTimeStaff: user.companyProfile.fullTimeStaff,
        womenCount: user.companyProfile.womenCount,
        womenInLeadershipPercent: user.companyProfile.womenInLeadershipPercent,
        mainMission: user.companyProfile.mainMission,
        projectsDescription: user.companyProfile.projectsDescription,
        recentAccomplishments: user.companyProfile.recentAccomplishments,
        beneficiaries: user.companyProfile.beneficiaries,
        mainDonors: user.companyProfile.mainDonors,
        mainUnrestrictedFundPriority:
          user.companyProfile.mainUnrestrictedFundPriority,
        resourceMobilizationTeam: user.companyProfile.resourceMobilizationTeam,
        socialMediaPresence: user.companyProfile.socialMediaPresence,
      },
    });
  } catch (error) {
    console.error("❌ [ORG-PROFILE GET] Error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 },
    );
  }
}
