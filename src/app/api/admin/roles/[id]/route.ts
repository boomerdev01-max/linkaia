// src/app/api/admin/roles/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ============================================
// GET - Récupérer les détails d'un rôle
// ============================================
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

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

    // 🔍 Récupérer le rôle avec toutes ses relations
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Rôle non trouvé" },
        { status: 404 },
      );
    }

    // 🎨 Formater la réponse
    const formattedRole = {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      userCount: role._count.users,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      role: formattedRole,
    });
  } catch (error) {
    console.error("❌ Error fetching role:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}

// ============================================
// PUT - Modifier un rôle
// ============================================
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

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
    const { name, description, isActive } = body;

    // ✅ Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Le nom du rôle est requis" },
        { status: 400 },
      );
    }

    // 🔍 Vérifier que le rôle existe
    const existingRole = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: "Rôle non trouvé" },
        { status: 404 },
      );
    }

    // 🚫 Protéger les rôles système contre la désactivation
    const systemRoles = ["administrator", "standard_user"];
    if (systemRoles.includes(existingRole.name) && isActive === false) {
      return NextResponse.json(
        {
          success: false,
          error: `Le rôle "${existingRole.name}" est un rôle système et ne peut pas être désactivé`,
        },
        { status: 403 },
      );
    }

    // 🔒 Vérifier l'unicité du nom si changé
    if (name !== existingRole.name) {
      const nameExists = await prisma.role.findUnique({
        where: { name },
      });

      if (nameExists) {
        return NextResponse.json(
          { success: false, error: "Un rôle avec ce nom existe déjà" },
          { status: 409 },
        );
      }
    }

    // 📝 Mettre à jour le rôle
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: isActive ?? existingRole.isActive,
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
      message: "Rôle modifié avec succès",
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        isActive: updatedRole.isActive,
        userCount: updatedRole._count.users,
        permissionCount: updatedRole._count.permissions,
      },
    });
  } catch (error) {
    console.error("❌ Error updating role:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}

// ============================================
// DELETE - Supprimer un rôle
// ============================================
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

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

    // 🔍 Vérifier que le rôle existe
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Rôle non trouvé" },
        { status: 404 },
      );
    }

    // 🚫 Protéger les rôles système
    const systemRoles = ["administrator", "standard_user", "moderator"];
    if (systemRoles.includes(role.name)) {
      return NextResponse.json(
        {
          success: false,
          error: `Le rôle "${role.name}" est un rôle système et ne peut pas être supprimé`,
        },
        { status: 403 },
      );
    }

    // 🚫 Bloquer la suppression si des utilisateurs sont assignés
    if (role._count.users > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Impossible de supprimer ce rôle : ${role._count.users} utilisateur(s) y sont assignés. Veuillez d'abord réassigner ces utilisateurs.`,
        },
        { status: 409 },
      );
    }

    // 🗑️ Supprimer le rôle
    await prisma.role.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Rôle supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ Error deleting role:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
