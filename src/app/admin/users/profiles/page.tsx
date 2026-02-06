// src/app/admin/users/profiles/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import UserProfilesClient from "@/components/admin/UserProfilesClient";

export const metadata = {
  title: "Profils Utilisateurs - Linkaïa",
  description: "Gestion des profils utilisateurs",
};

export default async function UserProfilesPage() {
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
      nom: true,
      prenom: true,
      email: true,
      profil: {
        select: {
          profilePhotoUrl: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/signin");
  }

  return (
    <div>
      <AdminHeader
        title="Profils Utilisateurs"
        description=""
        userName={`${user.prenom} ${user.nom}`}
        userEmail={user.email}
        userImage={user.profil?.profilePhotoUrl ?? null}
        notificationCount={0}
      />

      <UserProfilesClient />
    </div>
  );
}
