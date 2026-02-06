// lib/auth-helpers.ts
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

/**
 * 🔐 Récupère l'utilisateur connecté depuis Supabase + Prisma
 * À utiliser dans les API routes pour sécuriser les endpoints
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = await createSupabaseServerClient();

    // 1. Récupérer la session Supabase
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !supabaseUser) {
      return { user: null, error: "Non authentifié" };
    }

    // 2. Récupérer l'utilisateur complet depuis Prisma
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        supabaseId: true,
        level: true,
        emailVerified: true,
        profil: {
          select: {
            pseudo: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    if (!user) {
      return { user: null, error: "Utilisateur non trouvé" };
    }

    return { user, error: null };
  } catch (error) {
    console.error("❌ Auth error:", error);
    return { user: null, error: "Erreur d'authentification" };
  }
}

/**
 * 🛡️ Middleware pour protéger une API route
 * Retourne l'utilisateur ou une réponse d'erreur
 */
export async function requireAuth() {
  const { user, error } = await getAuthenticatedUser();

  if (!user) {
    return {
      authorized: false,
      user: null,
      errorResponse: {
        success: false,
        error: error || "Non authentifié",
      },
      status: 401,
    };
  }

  return {
    authorized: true,
    user,
    errorResponse: null,
    status: 200,
  };
}