// src/app/api/admin/roles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

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
        { status: 401 }
      );
    }

    // 🔍 Récupérer l'utilisateur depuis Prisma
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // 📊 Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const activeFilter = searchParams.get("active"); // "true" | "false" | null (tous)

    // 🎯 Construire le filtre
    const whereClause: any = {};
    if (activeFilter !== null) {
      whereClause.isActive = activeFilter === "true";
    }

    // 📦 Récupérer tous les rôles avec leurs relations
    const roles = await prisma.role.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            users: true, // Nombre d'utilisateurs ayant ce rôle
            permissions: true, // Nombre de permissions associées
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // 🎨 Formater les données pour le frontend
    const formattedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      userCount: role._count.users,
      permissionCount: role._count.permissions,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    }));

    // ✅ Retourner les rôles
    return NextResponse.json({
      success: true,
      roles: formattedRoles,
      total: formattedRoles.length,
    });
  } catch (error) {
    console.error("❌ Error fetching roles:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}