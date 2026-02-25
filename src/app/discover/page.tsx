// src/app/discover/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DiscoverClient from "@/components/discover/DiscoverClient";

export default async function DiscoverPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { profil: true },
  });

  if (!user) {
    redirect("/signin");
  }

  if (!user.profil && !user.skipProfileSetup) {
    redirect("/profile/setup");
  }

  const userData = {
    id: user.id,
    nom: user.nom,
    prenom: user.prenom,
    pseudo:
      user.profil?.pseudo ||
      `${user.prenom.toLowerCase()}.${user.nom.toLowerCase()}`,
    email: user.email,
    image: user.profil?.profilePhotoUrl || null,
    roles: [],
  };

  return <DiscoverClient user={userData} />;
}
