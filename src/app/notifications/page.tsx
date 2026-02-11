// src/app/notifications/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import NotificationsClient from "@/components/NotificationsClient";
import Header from "@/components/home/Header";

export const metadata = {
  title: "Notifications | Linkaïa",
  description: "Gérez vos notifications",
};

export default async function NotificationsPage() {
  // Vérifier l'authentification
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/signin");
  }

  // Vérifier que l'utilisateur existe dans Prisma et récupérer les données nécessaires
  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
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

  // Compter les notifications non lues pour le badge
  const unreadNotificationCount = await prisma.notification.count({
    where: {
      userId: user.id,
    },
  });

  // Formater l'utilisateur pour le Header
  const userForHeader = {
    id: user.id,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    pseudo: user.profil?.pseudo || `${user.prenom} ${user.nom}`,
    image: user.profil?.profilePhotoUrl || null,
  };

  return (
    <>
      <Header
        user={userForHeader}
        notificationCount={unreadNotificationCount}
      />
      <div className="pt-16">
        {" "}
        {/* Padding-top pour compenser le header fixe */}
        <NotificationsClient />
      </div>
    </>
  );
}
