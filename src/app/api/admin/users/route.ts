// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { getUserPrimaryRole } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    // 🔐 Vérifier l'authentification
    const { user, error } = await getAuthenticatedUser();

    if (!user || error) {
      return NextResponse.json(
        { error: error || "Non authentifié" },
        { status: 401 }
      );
    }

    // 📊 Récupérer les paramètres de recherche et pagination
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "";
    const levelFilter = searchParams.get("level") || "";
    const typeFilter = searchParams.get("type") || "";

    const skip = (page - 1) * limit;

    // 🔍 Construire les conditions de recherche
    const whereConditions: any = {
      AND: [],
    };

    // Filtre de recherche (nom, prénom, email)
    if (search) {
      whereConditions.AND.push({
        OR: [
          { nom: { contains: search, mode: "insensitive" } },
          { prenom: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // Filtre par niveau
    if (levelFilter) {
      whereConditions.AND.push({
        level: levelFilter,
      });
    }

    // Filtre par type de compte
    if (typeFilter) {
      whereConditions.AND.push({
        userType: typeFilter,
      });
    }

    // Si aucun filtre AND, on le retire
    if (whereConditions.AND.length === 0) {
      delete whereConditions.AND;
    }

    // 📝 Récupérer le total pour la pagination
    const total = await prisma.user.count({
      where: whereConditions,
    });

    // 📦 Récupérer les utilisateurs
    const users = await prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        emailVerified: true,
        level: true,
        userType: true,
        createdAt: true,
        profil: {
          select: {
            profilePhotoUrl: true,
          },
        },
        roles: {
          include: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // 🎭 Enrichir avec le rôle principal
    const usersWithRole = await Promise.all(
      users.map(async (user) => {
        const primaryRole = await getUserPrimaryRole(user.id);
        return {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          emailVerified: user.emailVerified,
          level: user.level,
          userType: user.userType,
          profilePhotoUrl: user.profil?.profilePhotoUrl || null,
          primaryRole,
          createdAt: user.createdAt,
        };
      })
    );

    // 🔢 Calculer le nombre total de pages
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      users: usersWithRole,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}