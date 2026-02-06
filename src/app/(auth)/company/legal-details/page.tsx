import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import CompanyLegalDetailsForm from "@/components/auth/CompanyLegalDetailsForm";

export default async function CompanyLegalDetailsPage() {
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

  if (!user || user.userType !== "COMPANY") {
    redirect("/home");
  }

  if (!user.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }

  if (user.companyProfile?.isLegalDetailsCompleted) {
    redirect("/company/documents");
  }

  return <CompanyLegalDetailsForm />;
}
