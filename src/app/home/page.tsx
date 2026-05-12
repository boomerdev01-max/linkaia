// src/app/home/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import HomeClient from "@/components/home/HomeClient";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: {
      profil: true,
      companyProfile: true, // ✅ nécessaire pour détecter le type
    },
  });

  if (!user) {
    redirect("/signin");
  }

  // ✅ Les company_user n'ont pas de profil particulier — ne pas les rediriger
  const isCompanyUser = user.companyProfile !== null;

  if (!isCompanyUser && !user.profil && !user.skipProfileSetup) {
    redirect("/profile/setup");
  }

  const userData = {
    id: user.id,
    nom: user.nom,
    prenom: user.prenom,
    pseudo:
      user.profil?.pseudo ||
      user.companyProfile?.companyName ||
      `${user.prenom.toLowerCase()}.${user.nom.toLowerCase()}`,
    email: user.email,
    image: user.profil?.profilePhotoUrl || user.companyProfile?.logoUrl || null,
    roles: [],
  };

  return <HomeClient user={userData} />;
}
