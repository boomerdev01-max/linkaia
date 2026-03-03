// src/app/api/admin/roles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

// ============================================
// POST - Créer un nouveau rôle
// ============================================
export async function POST(request: NextRequest) {
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

    // 📝 Récupérer les données du body
    const body = await request.json();
    const { name, description, isActive = true } = body;

    // ✅ Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Le nom du rôle est requis" },
        { status: 400 },
      );
    }

    // 🔒 Vérifier l'unicité du nom
    const existingRole = await prisma.role.findUnique({
      where: { name: name.trim() },
    });

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: "Un rôle avec ce nom existe déjà" },
        { status: 409 },
      );
    }

    // 📝 Créer le rôle
    const newRole = await prisma.role.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive,
      },
      include: {
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Rôle créé avec succès",
      role: {
        id: newRole.id,
        name: newRole.name,
        description: newRole.description,
        isActive: newRole.isActive,
        userCount: newRole._count.users,
        permissionCount: newRole._count.permissions,
      },
    });
  } catch (error) {
    console.error("❌ Error creating role:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}

// ============================================
// GET - Lister tous les rôles 
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

    // 🔍 Récupérer l'utilisateur depuis Prisma
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non trouvé" },
        { status: 404 },
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
      { status: 500 },
    );
  }
}
