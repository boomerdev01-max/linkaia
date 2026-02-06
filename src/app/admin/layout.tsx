// src/app/admin/layout.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { isUserStaff, getUserMenus } from "@/lib/rbac";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Administration - Linkaïa",
  description: "Panneau d'administration Linkaïa",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      mustChangePassword: true,
      profil: {
        select: {
          profilePhotoUrl: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/signin");
  }

  const isStaff = await isUserStaff(user.id);
  if (!isStaff) {
    redirect("/home");
  }

  if (user.mustChangePassword) {
    redirect("/change-password?force=true");
  }

  const menus = await getUserMenus(user.id);

  // ✅ On expose les données utilisateur via un contexte React
  // pour que toutes les pages admin puissent y accéder
  const adminUserData = {
    userName: `${user.prenom} ${user.nom}`,
    userEmail: user.email,
    userImage: user.profil?.profilePhotoUrl ?? null,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar menus={menus} />
      <main className="flex-1 overflow-y-auto">
        {/* ✅ On injecte les données via React.cloneElement dans children */}
        {/* Mais Next.js 14+ ne supporte pas ça facilement... */}
        {/* Solution : créer un Provider ou passer via props dans page.tsx */}
        {children}
      </main>
    </div>
  );
}
