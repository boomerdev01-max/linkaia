// src/app/admin/stats/reports/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";
import AdminHeader from "@/components/admin/AdminHeader";
import ReportsClient from "@/components/admin/reports/ReportsClient";

export const metadata = {
  title: "Revenus & Rapports - Linkaïa Admin",
  description: "Récapitulatif des revenus perçus par la plateforme",
};

export default async function StatsReportsPage() {
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

  const canView = await userHasPermission(user.id, "reports.view");

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
        title="Revenus & Rapports"
        description=""
        userName={`${user.prenom} ${user.nom}`}
        userEmail={user.email}
        userImage={user.profil?.profilePhotoUrl ?? null}
        notificationCount={0}
      />
      <ReportsClient />
    </div>
  );
}
