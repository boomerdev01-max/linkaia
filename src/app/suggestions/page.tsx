// src/app/suggestions/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import SuggestionsClient from "@/components/suggestions/SuggestionsClient";

export const metadata = {
  title: "Suggestions • Linkaïa",
  description: "Découvrez vos profils compatibles",
};

export default async function SuggestionsPage() {
  // 1. Vérifier l'authentification Supabase
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/signin");
  }

  // 2. Récupérer l'utilisateur + les champs du profil en une seule requête
  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: {
      id: true,
      prenom: true,
      nom: true,
      email: true,
      level: true,
      // ─────────────────────────────────────────────
      // IMPORTANT : pseudo et photo viennent de Profil
      // ─────────────────────────────────────────────
      profil: {
        select: {
          pseudo: true,
          profilePhotoUrl: true, // ← champ qui existe dans ton schéma
          // photos: { ... } n'existe plus → on utilise profilePhotoUrl
        },
      },
    },
  });

  if (!user) {
    redirect("/signin");
  }

  // 3. Préparer les données pour le composant client
  const userForClient = {
    id: user.id,
    prenom: user.prenom,
    nom: user.nom,
    pseudo: user.profil?.pseudo ?? "",
    email: user.email,
    level: user.level,
    image: user.profil?.profilePhotoUrl ?? null,
  };

  return <SuggestionsClient currentUser={userForClient} />;
}
