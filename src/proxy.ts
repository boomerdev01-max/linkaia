// proxy.ts - VERSION OPTIMISÉE AVEC CONFIG CENTRALISÉE
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_ROLES,
  STANDARD_ROLES,
  isAdminRole,
  getPrimaryRole,
  getDefaultRouteForRole,
} from "@/lib/roles-config";

/**
 * 🔐 Récupère les rôles de l'utilisateur
 */
async function getUserRoles(supabaseUserId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) return [];
  return user.roles.map((userRole: { role: { name: any; }; }) => userRole.role.name);
}

/**
 * 🎯 Détermine si l'utilisateur est un admin
 */
function hasAdminRole(userRoles: string[]): boolean {
  return userRoles.some((role) => isAdminRole(role));
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // ============================================
  // BYPASS POUR DÉCONNEXION
  // ============================================
  if (request.nextUrl.searchParams.has("logout")) {
    return response;
  }

  // ============================================
  // RÉCUPÉRATION DE LA SESSION
  // ============================================
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  // ============================================
  // UTILISATEURS NON AUTHENTIFIÉS
  // ============================================
  if (!supabaseUser) {
    const protectedPaths = [
      "/home",
      "/admin",
      "/onboarding",
      "/company",
      "/discover",
      "/rencontres",
      "/videos",
      "/events",
      "/profile",
      "/chat",
      "/lives",    // ← nouveau : pages lives (liste + room + création)
      "/wallet",   // ← nouveau : recharge wallet, historique
      "/my-stats",
    ];

    if (protectedPaths.some((path) => pathname.startsWith(path))) {
      console.log(`🔒 Unauthenticated access blocked: ${pathname} → /signin`);
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    return response;
  }

  // ============================================
  // UTILISATEURS AUTHENTIFIÉS
  // ============================================

  // Récupérer l'utilisateur complet
  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: {
      companyProfile: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    console.error("❌ User not found in Prisma:", supabaseUser.id);
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Déterminer les rôles de l'utilisateur
  const userRoles = await getUserRoles(supabaseUser.id);
  const isAdmin = hasAdminRole(userRoles);
  const primaryRole = getPrimaryRole(userRoles);
  const defaultRoute = primaryRole
    ? getDefaultRouteForRole(primaryRole)
    : "/home";

  console.log(
    `👤 ${user.email} | Roles: [${userRoles.join(", ")}] | Primary: ${primaryRole} | IsAdmin: ${isAdmin}`,
  );

  // ============================================
  // GESTION UTILISATEURS ADMIN
  // ============================================
  if (isAdmin) {
    // 1️⃣ Changement de mot de passe obligatoire
    if (user.mustChangePassword && pathname !== "/change-password") {
      console.log(
        `🔑 Admin must change password: ${pathname} → /change-password`,
      );
      return NextResponse.redirect(
        new URL("/change-password?force=true", request.url),
      );
    }

    // 2️⃣ Déjà sur une page admin → OK
    if (pathname.startsWith("/admin")) {
      return response;
    }

    // 3️⃣ Pages /change-password autorisées
    if (pathname.startsWith("/change-password")) {
      return response;
    }

    // 4️⃣ Empêcher l'accès aux pages utilisateur standard
    const userOnlyPaths = [
      "/home",
      "/onboarding",
      "/discover",
      "/rencontres",
      "/videos",
      "/events",
    ];

    if (
      userOnlyPaths.some((path) => pathname.startsWith(path)) ||
      pathname === "/" ||
      pathname === "/signin" ||
      pathname === "/signup"
    ) {
      console.log(`🔀 Admin redirect: ${pathname} → ${defaultRoute}`);
      return NextResponse.redirect(new URL(defaultRoute, request.url));
    }

    return response;
  }

  // ============================================
  // GESTION UTILISATEURS STANDARD/COMPANY
  // ============================================

  // 🚫 Bloquer l'accès au panneau admin pour non-admins
  if (pathname.startsWith("/admin")) {
    console.log(`⛔ Non-admin blocked from /admin: ${user.email}`);
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // === REDIRECTIONS DEPUIS SIGNIN/SIGNUP ===
  if (pathname === "/signin" || pathname === "/signup") {
    // Profil non complété → onboarding profil
    if (!user.isProfileCompleted && !user.skipProfileSetup) {
      return NextResponse.redirect(
        new URL("/onboarding/profile/welcome", request.url),
      );
    }

    // Préférences non faites → onboarding préférences
    if (
      (user.isProfileCompleted || user.skipProfileSetup) &&
      !user.isPreferenceCompleted &&
      !user.isPreferenceTerminated &&
      !user.skipPreferenceSetup
    ) {
      return NextResponse.redirect(
        new URL("/onboarding/preferences/welcome", request.url),
      );
    }

    // Tout complété → home
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // === PROTECTION PAGES /HOME ===
  if (pathname.startsWith("/home")) {
    // Profil non complété
    if (!user.isProfileCompleted && !user.skipProfileSetup) {
      return NextResponse.redirect(
        new URL("/onboarding/profile/welcome", request.url),
      );
    }

    // Préférences non faites
    if (
      (user.isProfileCompleted || user.skipProfileSetup) &&
      !user.isPreferenceCompleted &&
      !user.isPreferenceTerminated &&
      !user.skipPreferenceSetup
    ) {
      return NextResponse.redirect(
        new URL("/onboarding/preferences/welcome", request.url),
      );
    }
  }

  // === EMPÊCHER RETOUR ONBOARDING PROFIL SI COMPLÉTÉ ===
  if (
    pathname === "/onboarding/profile/welcome" ||
    pathname === "/onboarding/profile"
  ) {
    if (user.isProfileCompleted || user.skipProfileSetup) {
      // Préférences non faites → aller aux préférences
      if (
        !user.isPreferenceCompleted &&
        !user.isPreferenceTerminated &&
        !user.skipPreferenceSetup
      ) {
        return NextResponse.redirect(
          new URL("/onboarding/preferences/welcome", request.url),
        );
      }
      // Tout fait → home
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  // === EMPÊCHER RETOUR ONBOARDING PRÉFÉRENCES SI COMPLÉTÉ ===
  if (
    pathname === "/onboarding/preferences/welcome" ||
    pathname === "/onboarding/preferences"
  ) {
    // Préférences déjà faites → home
    if (
      user.isPreferenceCompleted ||
      user.isPreferenceTerminated ||
      user.skipPreferenceSetup
    ) {
      return NextResponse.redirect(new URL("/home", request.url));
    }

    // Profil non fait → retour au profil
    if (!user.isProfileCompleted && !user.skipProfileSetup) {
      return NextResponse.redirect(
        new URL("/onboarding/profile/welcome", request.url),
      );
    }
  }

  // === GESTION FLOW ENTREPRISE ===
  if (user.userType === "COMPANY") {
    // Email non vérifié
    if (!user.emailVerified && !pathname.startsWith("/verify-email")) {
      return NextResponse.redirect(
        new URL(
          `/verify-email?email=${encodeURIComponent(user.email)}`,
          request.url,
        ),
      );
    }

    // Détails légaux non complétés
    if (
      user.emailVerified &&
      user.companyProfile &&
      !user.companyProfile.isLegalDetailsCompleted &&
      !pathname.startsWith("/company/legal-details")
    ) {
      return NextResponse.redirect(
        new URL("/company/legal-details", request.url),
      );
    }

    // Documents non uploadés
    if (
      user.emailVerified &&
      user.companyProfile &&
      user.companyProfile.isLegalDetailsCompleted &&
      !user.companyProfile.isDocumentsCompleted &&
      !pathname.startsWith("/company/documents")
    ) {
      return NextResponse.redirect(new URL("/company/documents", request.url));
    }

    // Tout complété → empêcher retour
    if (
      user.companyProfile?.isDocumentsCompleted &&
      (pathname.startsWith("/company/legal-details") ||
        pathname.startsWith("/company/documents"))
    ) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
