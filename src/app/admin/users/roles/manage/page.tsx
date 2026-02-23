// src/app/admin/users/roles/manage/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import AdminHeader from "@/components/admin/AdminHeader";
import RoleManagementClient from "@/components/admin/roles/RoleManagementClient";

export const metadata = {
  title: "Gestion des Rôles - Administration",
  description: "",
};

export default async function RoleManagementPage() {
  // 🔐 Vérifier l'authentification
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/signin");
  }

  // 👤 Récupérer l'utilisateur avec son profil
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
        title="Gestion des Rôles"
        description=""
        userName={`${user.prenom} ${user.nom}`}
        userEmail={user.email}
        userImage={user.profil?.profilePhotoUrl ?? null}
        notificationCount={0}
      />

      <RoleManagementClient />
    </div>
  );
}
