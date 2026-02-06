// lib/redirect-logic.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserPrimaryRole, isUserStaff } from "@/lib/rbac";

/**
 * Gère la redirection RBAC après authentification
 */
export async function handleRBACRedirect(
  request: NextRequest,
  supabaseUserId: string
): Promise<NextResponse | null> {
  try {
    // Récupérer l'utilisateur avec ses rôles
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUserId },
      select: {
        id: true,
        isProfileCompleted: true,
        skipProfileSetup: true,
        isPreferenceCompleted: true,
        isPreferenceTerminated: true,
        skipPreferenceSetup: true,
        mustChangePassword: true,
        isFirstLogin: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) return null;

    const pathname = request.nextUrl.pathname;

    // === VÉRIFIER SI L'UTILISATEUR EST STAFF ===
    const isStaff = await isUserStaff(user.id);
    const primaryRole = await getUserPrimaryRole(user.id);

    // === SI STAFF : REDIRECTION VERS ADMIN ===
    if (isStaff) {
      // Si l'utilisateur doit changer son mot de passe
      if (user.mustChangePassword && pathname !== "/change-password") {
        return NextResponse.redirect(
          new URL("/change-password?force=true", request.url)
        );
      }

      // Si l'utilisateur est déjà sur une page admin, laisser passer
      if (pathname.startsWith("/admin")) {
        return null;
      }

      // Si l'utilisateur tente d'accéder aux pages standard, rediriger vers admin
      if (
        pathname.startsWith("/home") ||
        pathname.startsWith("/onboarding") ||
        pathname === "/" ||
        pathname === "/signin" ||
        pathname === "/signup"
      ) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }

      return null;
    }

    // === SI STANDARD_USER : LOGIQUE EXISTANTE ===
    // Si profil non complété → onboarding profil
    if (!user.isProfileCompleted && !user.skipProfileSetup) {
      if (!pathname.startsWith("/onboarding/profile")) {
        return NextResponse.redirect(
          new URL("/onboarding/profile/welcome", request.url)
        );
      }
    }

    // Si profil OK mais préférences non faites → onboarding préférences
    if (
      (user.isProfileCompleted || user.skipProfileSetup) &&
      !user.isPreferenceCompleted &&
      !user.isPreferenceTerminated &&
      !user.skipPreferenceSetup
    ) {
      if (!pathname.startsWith("/onboarding/preferences")) {
        return NextResponse.redirect(
          new URL("/onboarding/preferences/welcome", request.url)
        );
      }
    }

    // Si tout est complété et l'utilisateur est sur signin/signup → /home
    if (pathname === "/signin" || pathname === "/signup") {
      return NextResponse.redirect(new URL("/home", request.url));
    }

    return null;
  } catch (error) {
    console.error("Erreur handleRBACRedirect:", error);
    return null;
  }
}

/**
 * Vérifie si un chemin est protégé et nécessite l'authentification
 */
export function isProtectedPath(pathname: string): boolean {
  const protectedPaths = [
    "/home",
    "/admin",
    "/chat",
    "/profile",
    "/my-profile",
    "/onboarding",
    "/discover",
    "/rencontres",
    "/videos",
    "/events",
    "/notifications",
  ];

  return protectedPaths.some((path) => pathname.startsWith(path));
}

/**
 * Vérifie si un chemin est une page d'authentification
 */
export function isAuthPath(pathname: string): boolean {
  const authPaths = ["/signin", "/signup", "/verify-email", "/forgot-password", "/reset-password"];
  return authPaths.includes(pathname);
}

/**
 * Vérifie si un utilisateur a accès à une route admin
 */
export async function canAccessAdminRoute(
  userId: string,
  pathname: string
): Promise<boolean> {
  try {
    // Récupérer les menus de l'utilisateur
    const { getUserMenus } = await import("@/lib/rbac");
    const menus = await getUserMenus(userId);

    // Extraire tous les chemins accessibles (parents et enfants)
    const accessiblePaths = new Set<string>();
    
    menus.forEach((menu) => {
      if (menu.path) accessiblePaths.add(menu.path);
      menu.children?.forEach((child: any) => {
        if (child.path) accessiblePaths.add(child.path);
      });
    });

    // Vérifier si le chemin demandé est accessible
    // On vérifie aussi les chemins parents (ex: /admin/users/123 → /admin/users)
    return Array.from(accessiblePaths).some((path) => pathname.startsWith(path));
  } catch (error) {
    console.error("Erreur canAccessAdminRoute:", error);
    return false;
  }
}