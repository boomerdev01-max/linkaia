// src/app/company/[id]/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CompanyProfileClient from "@/components/company/CompanyProfileClient";

interface CompanyProfilePageProps {
  // ✅ Next.js 15+ : params est une Promise
  params: Promise<{ id: string }>;
}

export default async function CompanyProfilePage({
  params,
}: CompanyProfilePageProps) {
  // ✅ Await params avant utilisation
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/signin");
  }

  // Récupérer le viewer (celui qui consulte)
  const viewer = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: { id: true, companyProfile: { select: { id: true } } },
  });

  if (!viewer) redirect("/signin");

  // Récupérer le profil cible
  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      nom: true,
      email: true,
      createdAt: true,
      companyProfile: {
        select: {
          id: true,
          companyName: true,
          legalEmail: true,
          country: true,
          registrationType: true,
          legalRepresentative: true,
          legalAddress: true,
          registrationDocumentUrl: true,
          logoUrl: true,
          status: true,
          annualBudget: true,
          annualBudgetCurrency: true,
          fullTimeStaff: true,
          womenCount: true,
          womenInLeadershipPercent: true,
          mainMission: true,
          projectsDescription: true,
          recentAccomplishments: true,
          beneficiaries: true,
          mainDonors: true,
          mainUnrestrictedFundPriority: true,
          resourceMobilizationTeam: true,
          socialMediaPresence: true,
          isLegalDetailsCompleted: true,
          isDocumentsCompleted: true,
          isOrgProfileCompleted: true,
        },
      },
    },
  });

  if (!target || !target.companyProfile) {
    notFound();
  }

  // Seul le propriétaire peut éditer
  const isOwner = viewer.id === target.id;

  return (
    <CompanyProfileClient
      company={target.companyProfile}
      owner={{
        id: target.id,
        nom: target.nom,
        email: target.email,
        createdAt: target.createdAt.toISOString(),
      }}
      isOwner={isOwner}
    />
  );
}
