// src/app/notifications/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import NotificationsClient from "@/components/NotificationsClient";

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

  // Vérifier que l'utilisateur existe dans Prisma
  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: { id: true },
  });

  if (!user) {
    redirect("/signin");
  }

  // Retourner le composant client
  return <NotificationsClient />;
}
