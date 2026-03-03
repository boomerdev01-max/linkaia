import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { isUserStaff, userHasPermission } from "@/lib/rbac";
import AdminHeader from "@/components/admin/AdminHeader";
import CreateUserClient from "@/components/admin/CreateUserClient";

export const metadata = {
  title: "Créer un compte — Administration",
  description: "Création d'un nouveau compte utilisateur par l'administrateur",
};

export default async function CreateUserPage() {
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

  const isStaff = await isUserStaff(user.id);
  if (!isStaff) redirect("/home");

  const canCreate = await userHasPermission(user.id, "user.create");
  if (!canCreate) redirect("/admin");

  return (
    <div>
      <AdminHeader
        title="Créer un compte"
        description=""
        userName={`${user.prenom} ${user.nom}`}
        userEmail={user.email}
        userImage={user.profil?.profilePhotoUrl ?? null}
        notificationCount={0}
      />
      <CreateUserClient />
    </div>
  );
}
