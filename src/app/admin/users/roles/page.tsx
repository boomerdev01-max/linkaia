// src/app/admin/users/roles/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import AdminHeader from "@/components/admin/AdminHeader";
import RolesClient from "@/components/admin/RolesClient";

export const metadata = {
  title: "Rôles & Permissions - Administration",
  description: "Gestion des rôles utilisateurs et permissions",
};

export default async function RolesPage() {
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
        title="Rôles & Permissions"
        description=""
        userName={`${user.prenom} ${user.nom}`}
        userEmail={user.email}
        userImage={user.profil?.profilePhotoUrl ?? null}
        notificationCount={0}
      />

      <RolesClient />
    </div>
  );
}
