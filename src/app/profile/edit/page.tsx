// app/profile/edit/page.tsx
import ProfileEditModal from "@/components/profile/ProfileEditModal";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ProfileEditPage() {
  // Check authentication
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/signin");
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: {
      id: true,
      profil: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/signin");
  }

  // Si l'utilisateur n'a pas encore de profil, rediriger vers l'onboarding
  if (!user.profil) {
    redirect("/onboarding/profile/welcome");
  }

  return <ProfileEditModal userId={user.id} />;
}
