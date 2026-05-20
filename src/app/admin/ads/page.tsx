// src/app/admin/ads/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";
import { redirect } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminAdsClient from "@/components/admin/ads/AdminAdsClient";

export default async function AdminAdsPage() {
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

  const canAccess = await userHasPermission(user.id, "user.read");

  if (!canAccess) {
    return (
      <div>
        <AdminHeader
          title="Campagnes Publicitaires"
          description="Modération des annonces"
          userName={`${user.prenom} ${user.nom}`}
          userEmail={user.email}
          userImage={user.profil?.profilePhotoUrl ?? null}
        />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 font-medium">
              Vous n&apos;avez pas les permissions pour accéder à cette page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="Campagnes Publicitaires"
        description=""
        userName={`${user.prenom} ${user.nom}`}
        userEmail={user.email}
        userImage={user.profil?.profilePhotoUrl ?? null}
      />
      <div className="p-6">
        <AdminAdsClient />
      </div>
    </div>
  );
}
