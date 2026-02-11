// src/app/api/admin/permissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

// ============================================
// GET - Récupérer toutes les permissions
// ============================================
export async function GET(request: NextRequest) {
  try {
    // 🔐 Vérifier l'authentification
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 },
      );
    }

    // 📦 Récupérer toutes les permissions actives
    const permissions = await prisma.permission.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    // 🎨 Grouper les permissions par catégorie (basé sur le préfixe)
    const groupedPermissions: Record<string, any[]> = {};

    permissions.forEach((permission) => {
      // Extraire la catégorie du nom (ex: "user.read" → "user")
      const category = permission.name.split(".")[0];
      const categoryLabel = getCategoryLabel(category);

      if (!groupedPermissions[categoryLabel]) {
        groupedPermissions[categoryLabel] = [];
      }

      groupedPermissions[categoryLabel].push(permission);
    });

    return NextResponse.json({
      success: true,
      permissions,
      grouped: groupedPermissions,
      total: permissions.length,
    });
  } catch (error) {
    console.error("❌ Error fetching permissions:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}

// Helper pour traduire les catégories
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    user: "Gestion Utilisateurs",
    role: "Gestion Rôles",
    permission: "Gestion Permissions",
    post: "Gestion Contenu",
    comment: "Gestion Commentaires",
    media: "Gestion Médias",
    transaction: "Transactions",
    invoice: "Factures",
    statistics: "Statistiques",
    notification: "Notifications",
    email: "Emails",
    system: "Système",
    prestige: "Codes Prestige",
    dashboard: "Dashboard",
    reports: "Rapports",
  };

  return (
    labels[category] || category.charAt(0).toUpperCase() + category.slice(1)
  );
}
