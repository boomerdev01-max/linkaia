// src/app/home/page.tsx (version simplifiée)
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
    include: { profil: true },
  });

  if (!user) {
    redirect("/signin");
  }

  if (!user.profil && !user.skipProfileSetup) {
    redirect("/profile/setup");
  }

  // CORRECTION ICI : utiliser profil?.pseudo
  const userData = {
    id: user.id,
    nom: user.nom,
    prenom: user.prenom,
    pseudo: user.profil?.pseudo || `${user.prenom.toLowerCase()}.${user.nom.toLowerCase()}`,
    email: user.email,
    image: user.profil?.profilePhotoUrl || null,
    roles: [],
  };

  return <HomeClient user={userData} />;
}