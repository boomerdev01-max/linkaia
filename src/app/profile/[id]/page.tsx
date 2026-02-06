// app/profile/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import PublicProfileView from "@/components/profile/PublicProfileView";

/**
 * Page du profil PUBLIC d'un utilisateur
 * Route : /profile/[id]
 * Accessible par tous les utilisateurs connectés
 */
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Vérifier l'authentification
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/signin");
  }

  // Récupérer l'utilisateur connecté
  const currentUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  });

  if (!currentUser) {
    redirect("/signin");
  }

  const { id: profileUserId } = await params;

  // ✅ Si l'utilisateur essaie de voir son propre profil via /profile/[id]
  // On le redirige vers /my-profile
  if (profileUserId === currentUser.id) {
    redirect("/my-profile");
  }

  // Récupérer l'utilisateur du profil public
  const profileUser = await prisma.user.findUnique({
    where: { id: profileUserId },
    include: {
      profil: {
        include: {
          interests: {
            include: {
              interest: {
                include: {
                  category: true,
                },
              },
            },
          },
          nationalites: {
            include: {
              nationality: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  });

  if (!profileUser || !profileUser.profil) {
    notFound();
  }

  // Calculer l'âge
  const age = profileUser.profil.birthdate
    ? new Date().getFullYear() -
      new Date(profileUser.profil.birthdate).getFullYear()
    : null;

  return (
    <PublicProfileView
      profile={{
        ...profileUser.profil,
        user: profileUser,
      }}
      age={age}
      currentUserId={currentUser.id}
      currentUserName={`${currentUser.prenom} ${currentUser.nom}`}
    />
  );
}
