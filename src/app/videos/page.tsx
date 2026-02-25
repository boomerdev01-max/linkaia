import VideosClient from "@/components/videos/VideosClient";

// Dans ton vrai projet, tu recuperes l'utilisateur authentifie via Supabase SSR :
// import { createClient } from "@/lib/supabase/server-client";
// import { redirect } from "next/navigation";
// import prisma from "@/lib/prisma";

export const metadata = {
  title: "Videos - Linkaia",
  description: "Decouvrez les videos tendances sur Linkaia",
};

export default async function VideosPage() {
  // ----- VERSION POUR TON VRAI PROJET -----
  // const supabase = await createClient();
  // const { data: { user: authUser } } = await supabase.auth.getUser();
  // if (!authUser) redirect("/signin");
  // const dbUser = await prisma.user.findUnique({
  //   where: { id: authUser.id },
  //   select: { id: true, nom: true, prenom: true, email: true, profil: { select: { pseudo: true, profilePhotoUrl: true } } }
  // });
  // if (!dbUser) redirect("/signin");
  // const user = {
  //   id: dbUser.id,
  //   nom: dbUser.nom,
  //   prenom: dbUser.prenom,
  //   pseudo: dbUser.profil?.pseudo || "",
  //   email: dbUser.email,
  //   image: dbUser.profil?.profilePhotoUrl || null,
  // };

  // ----- VERSION DEMO (utilisateur factice) -----
  const user = {
    id: "demo-user",
    nom: "Demo",
    prenom: "Utilisateur",
    pseudo: "demo",
    email: "demo@linkaia.com",
    image: null,
  };

  return <VideosClient user={user} />;
}
