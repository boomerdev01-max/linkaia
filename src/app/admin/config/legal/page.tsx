import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import AdminHeader from "@/components/admin/AdminHeader";
import LegalClient from "@/components/admin/config/LegalClient";

export const metadata = {
  title: "Règles & Confidentialité - Linkaïa Admin",
  description:
    "Conditions générales d'utilisation et politique de confidentialité de Linkaïa",
};

export default async function LegalPage() {
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

  return (
    <div>
      <AdminHeader
        title="Règles & Confidentialité"
        description=""
        userName={`${user.prenom} ${user.nom}`}
        userEmail={user.email}
        userImage={user.profil?.profilePhotoUrl ?? null}
        notificationCount={0}
      />
      <LegalClient />
    </div>
  );
}
