// src/app/admin/content/pending-media/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";
import AdminHeader from "@/components/admin/AdminHeader";
import PendingMediaClient from "@/components/admin/content/PendingMediaClient";

export const metadata = {
  title: "Surveillance des médias - Linkaïa Admin",
  description: "Consultation et modération des médias de la plateforme",
};

export default async function PendingMediaPage() {
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

  const canView = await userHasPermission(user.id, "media.moderate");

  if (!canView) {
    return (
      <div>
        <AdminHeader
          title="Accès refusé"
          description="Vous n'avez pas les permissions pour accéder à cette page"
          userName={`${user.prenom} ${user.nom}`}
          userEmail={user.email}
          userImage={user.profil?.profilePhotoUrl ?? null}
        />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 font-medium">
              Contactez un administrateur pour obtenir les accès nécessaires.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="Surveillance des médias"
        description=""
        userName={`${user.prenom} ${user.nom}`}
        userEmail={user.email}
        userImage={user.profil?.profilePhotoUrl ?? null}
        notificationCount={0}
      />
      <PendingMediaClient />
    </div>
  );
}
