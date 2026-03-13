// src/app/my-stats/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import Header from "@/components/home/Header";
import LeftSidebar from "@/components/home/LeftSidebar";
import StatsClient from "@/components/stats/StatsClient";

export const metadata = {
  title: "Mes statistiques - Linkaïa",
  description: "Consultez les performances de vos publications",
};

export default async function MyStatsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      profil: {
        select: {
          pseudo: true,
          profilePhotoUrl: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/signin");
  }

  const formattedUser = {
    id: user.id,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    pseudo: user.profil?.pseudo ?? user.prenom,
    image: user.profil?.profilePhotoUrl ?? null,
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header user={formattedUser} />

      <div className="flex pt-16 justify-center">
        {/* LeftSidebar — identique à /home */}
        <div
          className="hidden md:block fixed left-0 top-16 bottom-0"
          style={{ width: "282px" }}
        >
          <LeftSidebar user={formattedUser} />
        </div>

        {/* Contenu principal — plus large que le feed (pas de RightSidebar) */}
        <main
          className="w-full md:ml-70.5 min-h-[calc(100vh-64px)]"
          style={{ maxWidth: "900px" }}
        >
          <div className="p-4 lg:p-6">
            <StatsClient user={formattedUser} />
          </div>
        </main>
      </div>
    </div>
  );
}
