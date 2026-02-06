// app/my-profile/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/profile/ProfileView";
import Header from "@/components/home/Header";

/**
 * Page du profil PRIVÉ de l'utilisateur connecté
 * Route : /my-profile
 * Accessible uniquement par le propriétaire du profil
 */
export default async function MyProfilePage() {
  // Vérifier l'authentification
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/signin");
  }

  // Récupérer l'utilisateur depuis la base de données
  const currentUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
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

  if (!currentUser || !currentUser.profil) {
    redirect("/onboarding/profile");
  }

  // Calculer l'âge
  const age = currentUser.profil.birthdate
    ? new Date().getFullYear() -
      new Date(currentUser.profil.birthdate).getFullYear()
    : null;

  // Préparer les données pour le Header
  const headerUser = {
    id: currentUser.id,
    nom: currentUser.nom,
    prenom: currentUser.prenom,
    pseudo: currentUser.profil.pseudo || "",
    email: currentUser.email,
    image: currentUser.profil.profilePhotoUrl,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixe */}
      <Header user={headerUser} notificationCount={0} />

      {/* Contenu principal avec padding-top pour compenser le header fixe */}
      <main className="pt-8 md:pt-16">
        <ProfileView
          profile={{
            ...currentUser.profil,
            user: currentUser,
          }}
          age={age}
          isOwnProfile={true}
          currentUserId={currentUser.id}
        />
      </main>
    </div>
  );
}
