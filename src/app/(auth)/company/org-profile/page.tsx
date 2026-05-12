// app/(company)/company/org-profile/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import CompanyOrgProfileForm from "@/components/auth/CompanyOrgProfileForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil Organisation",
  description: "Complétez le profil de votre organisation",
};

export default async function CompanyOrgProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { companyProfile: true },
  });

  // Pas un compte entreprise → home
  if (!user || !user.companyProfile) {
    redirect("/home");
  }

  // Email non vérifié → verify-email
  if (!user.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }

  // Étapes précédentes non complétées → les renvoyer dans l'ordre
  if (!user.companyProfile.isLegalDetailsCompleted) {
    redirect("/company/legal-details");
  }

  if (!user.companyProfile.isDocumentsCompleted) {
    redirect("/company/documents");
  }

  // Déjà complété (ou skippé) → home
  if (user.companyProfile.isOrgProfileCompleted) {
    redirect("/home");
  }

  return <CompanyOrgProfileForm />;
}