// src/app/admin/config/administration/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission, getUserPrimaryRole } from "@/lib/rbac";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminConfigClient from "@/components/admin/config/AdminConfigClient";

export const metadata = {
  title: "Paramètres — Linkaïa Admin",
  description: "Paramètres du panel administrateur",
};

export default async function AdminConfigPage() {
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
      createdAt: true,
      updatedAt: true,
      adminCreated: true,
      mustChangePassword: true,
      isFirstLogin: true,
      provider: true,
      emailVerified: true,
      level: true,
      profil: { select: { profilePhotoUrl: true } },
      roles: {
        include: { role: { select: { name: true, description: true } } },
      },
    },
  });

  if (!user) redirect("/signin");

  const canView = await userHasPermission(user.id, "dashboard.view");
  if (!canView) redirect("/admin");

  const primaryRole = await getUserPrimaryRole(user.id);

  const configData = {
    account: {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      photo: user.profil?.profilePhotoUrl ?? null,
      role: primaryRole ?? "administrator",
      level: user.level,
      provider: user.provider,
      emailVerified: user.emailVerified,
      mustChangePassword: user.mustChangePassword,
      isFirstLogin: user.isFirstLogin,
      adminCreated: user.adminCreated,
      joinedAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    platform: {
      name: "Linkaïa",
      version: "1.0.0",
      environment: process.env.NODE_ENV ?? "production",
      nextVersion: "15.x",
      prismaVersion: "7.x",
      region: "Afrique de l'Ouest",
      currency: "XOF",
      currencySymbol: "CFA",
      timezone: "Africa/Abidjan",
      language: "Français (fr-FR)",
      supportEmail: "support@linkaia.com",
      legalEmail: "legal@linkaia.com",
      baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://linkaia.com",
      supabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
      emailConfigured: !!process.env.RESEND_API_KEY,
    },
  };

  return (
    <div>
      <AdminHeader
        title="Paramètres"
        description=""
        userName={`${user.prenom} ${user.nom}`}
        userEmail={user.email}
        userImage={user.profil?.profilePhotoUrl ?? null}
        notificationCount={0}
      />
      <AdminConfigClient data={configData} />
    </div>
  );
}
