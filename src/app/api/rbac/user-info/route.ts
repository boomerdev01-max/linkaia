// app/api/rbac/user-info/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import {
  getUserRoles,
  getUserPermissions,
  getUserMenus,
  getUserPrimaryRole,
} from "@/lib/rbac";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        level: true,
        mustChangePassword: true,
        isFirstLogin: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    // Récupérer les données RBAC
    const [roles, permissions, menus, primaryRole] = await Promise.all([
      getUserRoles(user.id),
      getUserPermissions(user.id),
      getUserMenus(user.id),
      getUserPrimaryRole(user.id),
    ]);

    return NextResponse.json({
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        level: user.level,
        mustChangePassword: user.mustChangePassword,
        isFirstLogin: user.isFirstLogin,
      },
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
      })),
      primaryRole,
      permissions,
      menus,
    });
  } catch (error) {
    console.error("Erreur API /rbac/user-info:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}