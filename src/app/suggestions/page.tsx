// src/app/suggestions/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import Header from "@/components/home/Header";
import SuggestionsClient from "@/components/suggestions/SuggestionsClient";

export const metadata = {
  title: "Suggestions • Linkaïa",
  description: "Découvrez vos profils compatibles",
};

export default async function SuggestionsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: {
      id: true,
      prenom: true,
      nom: true,
      email: true,
      level: true,
      profil: {
        select: {
          pseudo: true,
          profilePhotoUrl: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/signin");
  }

  const formattedUser = {
    id: user.id,
    prenom: user.prenom,
    nom: user.nom,
    pseudo: user.profil?.pseudo ?? user.prenom,
    email: user.email,
    level: user.level,
    image: user.profil?.profilePhotoUrl ?? null,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={formattedUser} />
      <main className="pt-16">
        <SuggestionsClient currentUser={formattedUser} />
      </main>
    </div>
  );
}
