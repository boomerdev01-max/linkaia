// src/app/admin/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import { Users, Image, CreditCard, Wallet } from "lucide-react";

export default async function AdminDashboard() {
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
          profilePhotoUrl: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/signin");
  }

  const canView = await userHasPermission(user.id, "dashboard.view");
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

  const [totalUsers, totalPosts] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
  ]);

  const stats = [
    {
      label: "Total utilisateurs",
      value: totalUsers.toString(),
      icon: Users,
      color: "bg-blue-100",
      textColor: "text-blue-600",
      href: "/admin/users/profiles", // Redirection vers la page des profils utilisateurs
    },
    {
      label: "Posts publiés",
      value: totalPosts.toString(),
      icon: Image,
      color: "bg-green-100",
      textColor: "text-green-600",
      href: "/admin", // Même page (dashboard admin)
    },
    {
      label: "Transactions",
      value: "0",
      icon: CreditCard,
      color: "bg-purple-100",
      textColor: "text-purple-600",
      href: "/admin", // Même page (dashboard admin)
    },
    {
      label: "Revenus",
      value: "0 XOF",
      icon: Wallet,
      color: "bg-orange-100",
      textColor: "text-orange-600",
      href: "/admin", // Même page (dashboard admin)
    },
  ];

  return (
    <div>
      <AdminHeader
        title="Panneau d'administration"
        description=""
        userName={`${user.prenom} ${user.nom}`}
        userEmail={user.email}
        userImage={user.profil?.profilePhotoUrl ?? null}
        notificationCount={0}
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-xl"
              >
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all hover:border-gray-300 cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center`}
                    >
                      <Icon className={`h-6 w-6 ${stat.textColor}`} />
                    </div>
                  </div>
                  <h3 className="text-gray-600 text-sm font-medium">
                    {stat.label}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
