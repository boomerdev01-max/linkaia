// src/app/admin/communication/notifications/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminNotificationsClient from "@/components/admin/notifications/AdminNotificationsClient";

export const metadata = {
  title: "Notifications — Linkaïa Admin",
  description: "Centre de notifications de l'administration",
};

export default async function AdminNotificationsPage() {
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

  const canView = await userHasPermission(user.id, "notifications.view");

  if (!canView) {
    return (
      <div>
        <AdminHeader
          title="Accès refusé"
          description=""
          userName={`${user.prenom} ${user.nom}`}
          userEmail={user.email}
          userImage={user.profil?.profilePhotoUrl ?? null}
        />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-800 font-medium text-sm">
              Contactez un administrateur pour obtenir les accès nécessaires.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Comptage des notifs admin non lues pour le badge du header
  const unreadAdminNotifs = await prisma.notification.findMany({
    where: {
      userId: user.id,
      isRead: false,
      metadata: { path: ["adminOnly"], equals: true },
    },
    select: { id: true },
  });

  return (
    <div>
      <AdminHeader
        title="Notifications"
        description="Évènements importants de la plateforme"
        userName={`${user.prenom} ${user.nom}`}
        userEmail={user.email}
        userImage={user.profil?.profilePhotoUrl ?? null}
        notificationCount={unreadAdminNotifs.length}
      />
      <AdminNotificationsClient />
    </div>
  );
}
