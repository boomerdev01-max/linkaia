// src/app/api/company/[id]/profile/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

// ── Schémas par section ───────────────────────────────────────────────────────

const legalSchema = z.object({
  section: z.literal("legal"),
  country: z.string().min(1).optional().nullable(),
  registrationType: z
    .enum([
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
    ])
    .optional()
    .nullable(),
  legalRepresentative: z.string().min(2).optional().nullable(),
  legalAddress: z.string().min(5).optional().nullable(),
});

const orgSchema = z.object({
  section: z.literal("org"),
  annualBudget: z.number().positive().optional().nullable(),
  annualBudgetCurrency: z.string().optional().nullable(),
  fullTimeStaff: z.number().int().min(0).optional().nullable(),
  womenCount: z.number().int().min(0).optional().nullable(),
  womenInLeadershipPercent: z.number().min(0).max(100).optional().nullable(),
  mainMission: z.string().max(2000).optional().nullable(),
  projectsDescription: z.string().max(3000).optional().nullable(),
  recentAccomplishments: z.string().max(2000).optional().nullable(),
  beneficiaries: z.string().max(1000).optional().nullable(),
  mainDonors: z
    .array(
      z.object({
        name: z.string().min(1),
        amount: z.number().positive(),
        currency: z.string().default("XOF"),
        year: z.number().int().min(2000).max(new Date().getFullYear()),
      }),
    )
    .max(20)
    .optional()
    .nullable(),
  mainUnrestrictedFundPriority: z.string().max(1000).optional().nullable(),
  resourceMobilizationTeam: z.boolean().optional().nullable(),
});

const socialSchema = z.object({
  section: z.literal("social"),
  website: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  youtube: z.string().optional().nullable(),
});

const bodySchema = z.discriminatedUnion("section", [
  legalSchema,
  orgSchema,
  socialSchema,
]);

// ── Handler ───────────────────────────────────────────────────────────────────

export async function PATCH(
  request: Request,
  // ✅ FIX Next.js 15+ : params est une Promise
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // ✅ Await params avant toute utilisation
    const { id } = await params;

    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Seul le propriétaire peut modifier son propre profil
    const viewer = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { id: true },
    });

    if (!viewer || viewer.id !== id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId: id },
    });

    if (!companyProfile) {
      return NextResponse.json(
        { error: "Profil entreprise introuvable" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validated = bodySchema.parse(body);

    let updateData: Record<string, unknown> = {};

    if (validated.section === "legal") {
      updateData = {
        country: validated.country ?? null,
        registrationType: validated.registrationType ?? null,
        legalRepresentative: validated.legalRepresentative ?? null,
        legalAddress: validated.legalAddress ?? null,
        isLegalDetailsCompleted: !!(
          validated.country &&
          validated.registrationType &&
          validated.legalRepresentative &&
          validated.legalAddress
        ),
      };
    }

    if (validated.section === "org") {
      updateData = {
        annualBudget: validated.annualBudget ?? null,
        annualBudgetCurrency: validated.annualBudgetCurrency ?? "XOF",
        fullTimeStaff: validated.fullTimeStaff ?? null,
        womenCount: validated.womenCount ?? null,
        womenInLeadershipPercent: validated.womenInLeadershipPercent ?? null,
        mainMission: validated.mainMission ?? null,
        projectsDescription: validated.projectsDescription ?? null,
        recentAccomplishments: validated.recentAccomplishments ?? null,
        beneficiaries: validated.beneficiaries ?? null,
        mainDonors: validated.mainDonors ?? undefined,
        mainUnrestrictedFundPriority:
          validated.mainUnrestrictedFundPriority ?? null,
        resourceMobilizationTeam: validated.resourceMobilizationTeam ?? null,
      };
    }

    if (validated.section === "social") {
      const cleaned: Record<string, string> = {};
      const fields = [
        "website",
        "linkedin",
        "facebook",
        "twitter",
        "instagram",
        "youtube",
      ] as const;
      for (const key of fields) {
        const val = validated[key];
        if (val && val.trim() !== "") cleaned[key] = val.trim();
      }
      updateData = {
        socialMediaPresence: Object.keys(cleaned).length > 0 ? cleaned : null,
      };
    }

    const updated = await prisma.companyProfile.update({
      where: { userId: id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }
    console.error("❌ [COMPANY PROFILE PATCH]", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 },
    );
  }
}

