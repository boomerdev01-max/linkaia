// src/app/admin/prestige-codes/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";
import { redirect } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import PrestigeCodesClient from "@/components/admin/PrestigeCodesClient";

export default async function PrestigeCodesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) redirect("/signin");

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      profil: { select: { profilePhotoUrl: true } },
    },
  });

  if (!user) redirect("/signin");

  const canManage = await userHasPermission(user.id, "prestige.manage");

  if (!canManage) {
    return (
      <div>
        <AdminHeader
          title="Codes Prestige"
          description="Gestion des invitations exclusives"
          userName={`${user.prenom} ${user.nom}`}
          userEmail={user.email}
          userImage={user.profil?.profilePhotoUrl ?? null}
        />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 font-medium">
              Vous n'avez pas les permissions pour accéder à cette page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="Codes Prestige"
        description="Générez et gérez les invitations exclusives pour les membres Prestige"
        userName={`${user.prenom} ${user.nom}`}
        userEmail={user.email}
        userImage={user.profil?.profilePhotoUrl ?? null}
      />
      <div className="p-6">
        <PrestigeCodesClient />
      </div>
    </div>
  );
}