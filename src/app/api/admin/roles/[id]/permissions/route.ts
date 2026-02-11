// src/app/api/admin/roles/[id]/permissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ============================================
// PUT - Assigner/Retirer des permissions
// ============================================
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: roleId } = await context.params;

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
    const { permissionIds } = body;

    // ✅ Validation
    if (!Array.isArray(permissionIds)) {
      return NextResponse.json(
        { success: false, error: "permissionIds doit être un tableau" },
        { status: 400 },
      );
    }

    // 🔍 Vérifier que le rôle existe
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Rôle non trouvé" },
        { status: 404 },
      );
    }

    // 🔍 Vérifier que toutes les permissions existent
    if (permissionIds.length > 0) {
      const permissions = await prisma.permission.findMany({
        where: {
          id: { in: permissionIds },
        },
      });

      if (permissions.length !== permissionIds.length) {
        return NextResponse.json(
          { success: false, error: "Certaines permissions n'existent pas" },
          { status: 400 },
        );
      }
    }

    // 🔄 Utiliser une transaction pour garantir la cohérence
    await prisma.$transaction(async (tx) => {
      // 1️⃣ Supprimer toutes les permissions actuelles
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // 2️⃣ Ajouter les nouvelles permissions
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId: string) => ({
            roleId,
            permissionId,
          })),
        });
      }
    });

    // 📊 Récupérer le rôle mis à jour
    const updatedRole = await prisma.role.findUnique({
      where: { id: roleId },
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
      },
    });

    return NextResponse.json({
      success: true,
      message: "Permissions mises à jour avec succès",
      role: {
        id: updatedRole!.id,
        name: updatedRole!.name,
        permissionCount: updatedRole!.permissions.length,
        permissions: updatedRole!.permissions.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Error updating role permissions:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
