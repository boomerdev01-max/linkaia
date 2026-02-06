// app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { userHasPermission } from "@/lib/rbac";

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
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    // Vérifier permission dashboard.view
    const canViewDashboard = await userHasPermission(user.id, "dashboard.view");
    if (!canViewDashboard) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer les statistiques du dashboard
    const [totalUsers, totalPosts, totalTransactions] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      // Si tu as une table Transaction, sinon mettre 0
      Promise.resolve(0), // prisma.transaction.count()
    ]);

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        createdAt: true,
      },
    });

    const recentPosts = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalPosts,
        totalTransactions,
      },
      recentUsers,
      recentPosts,
    });
  } catch (error) {
    console.error("Erreur API /admin/dashboard:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
