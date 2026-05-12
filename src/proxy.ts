// proxy.ts - VERSION CORRIGÉE
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import {
  isAdminRole,
  getPrimaryRole,
  getDefaultRouteForRole,
} from "@/lib/roles-config";

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
      "/lives",
      "/wallet",
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

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      mustChangePassword: true,
      isProfileCompleted: true,
      isProfileTerminated: true,
      skipProfileSetup: true,
      isPreferenceCompleted: true,
      isPreferenceTerminated: true,
      skipPreferenceSetup: true,
      companyProfile: {
        select: {
          isLegalDetailsCompleted: true,
          isDocumentsCompleted: true,
          isOrgProfileCompleted: true,
          skipOrgProfileSetup: true,
        },
      },
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

  // Déterminer les rôles et le type d'utilisateur
  const userRoles = user.roles.map((userRole) => userRole.role.name);
  const isAdmin = hasAdminRole(userRoles);
  const primaryRole = getPrimaryRole(userRoles);
  const defaultRoute = primaryRole
    ? getDefaultRouteForRole(primaryRole)
    : "/home";

  // ✅ Clé : est-ce un compte entreprise ?
  const isCompanyUser = user.companyProfile !== null;

  console.log(
    `👤 ${user.email} | Roles: [${userRoles.join(", ")}] | Primary: ${primaryRole} | IsAdmin: ${isAdmin} | IsCompany: ${isCompanyUser}`,
  );

  // ============================================
  // GESTION UTILISATEURS ADMIN
  // ============================================
  if (isAdmin) {
    if (user.mustChangePassword && pathname !== "/change-password") {
      console.log(
        `🔑 Admin must change password: ${pathname} → /change-password`,
      );
      return NextResponse.redirect(
        new URL("/change-password?force=true", request.url),
      );
    }

    if (pathname.startsWith("/admin")) {
      return response;
    }

    if (pathname.startsWith("/change-password")) {
      return response;
    }

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
  // BLOQUER ACCÈS ADMIN POUR NON-ADMINS
  // ============================================
  if (pathname.startsWith("/admin")) {
    console.log(`⛔ Non-admin blocked from /admin: ${user.email}`);
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // ============================================
  // GESTION FLOW ENTREPRISE
  // ✅ Traité EN PREMIER pour les company_users,
  //    avant tout bloc onboarding particulier
  // ============================================
  if (isCompanyUser) {
    // Email non vérifié
    if (!user.emailVerified && !pathname.startsWith("/verify-email")) {
      return NextResponse.redirect(
        new URL(
          `/verify-email?email=${encodeURIComponent(user.email)}`,
          request.url,
        ),
      );
    }

    // Étape 2 — Détails légaux
    if (
      user.emailVerified &&
      !user.companyProfile!.isLegalDetailsCompleted &&
      !pathname.startsWith("/company/legal-details")
    ) {
      return NextResponse.redirect(
        new URL("/company/legal-details", request.url),
      );
    }

    // Étape 3 — Documents
    if (
      user.emailVerified &&
      user.companyProfile!.isLegalDetailsCompleted &&
      !user.companyProfile!.isDocumentsCompleted &&
      !pathname.startsWith("/company/documents")
    ) {
      return NextResponse.redirect(new URL("/company/documents", request.url));
    }

    // Étape 4 — Profil organisation
    if (
      user.emailVerified &&
      user.companyProfile!.isLegalDetailsCompleted &&
      user.companyProfile!.isDocumentsCompleted &&
      !user.companyProfile!.isOrgProfileCompleted &&
      !user.companyProfile!.skipOrgProfileSetup &&
      !pathname.startsWith("/company/org-profile")
    ) {
      return NextResponse.redirect(
        new URL("/company/org-profile", request.url),
      );
    }

    // Empêcher retour sur étapes déjà franchies
    if (
      user.companyProfile!.isDocumentsCompleted &&
      (pathname.startsWith("/company/legal-details") ||
        pathname.startsWith("/company/documents"))
    ) {
      if (
        !user.companyProfile!.isOrgProfileCompleted &&
        !user.companyProfile!.skipOrgProfileSetup
      ) {
        return NextResponse.redirect(
          new URL("/company/org-profile", request.url),
        );
      }
      return NextResponse.redirect(new URL("/home", request.url));
    }

    // Empêcher retour sur org-profile si déjà complété/skippé
    if (
      (user.companyProfile!.isOrgProfileCompleted ||
        user.companyProfile!.skipOrgProfileSetup) &&
      pathname.startsWith("/company/org-profile")
    ) {
      return NextResponse.redirect(new URL("/home", request.url));
    }

    // ✅ Company user avec toutes les étapes franchies ou en cours :
    //    on laisse passer — PAS de redirection vers onboarding particulier
    return response;
  }

  // ============================================
  // GESTION FLOW PARTICULIER (standard_user uniquement)
  // ✅ Ce bloc ne s'exécute JAMAIS pour un company_user
  // ============================================

  // Redirections depuis signin/signup
  if (pathname === "/signin" || pathname === "/signup") {
    if (!user.isProfileCompleted && !user.skipProfileSetup) {
      return NextResponse.redirect(
        new URL("/onboarding/profile/welcome", request.url),
      );
    }

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

    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Protection pages /home
  if (pathname.startsWith("/home")) {
    if (!user.isProfileCompleted && !user.skipProfileSetup) {
      return NextResponse.redirect(
        new URL("/onboarding/profile/welcome", request.url),
      );
    }

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

  // Empêcher retour onboarding profil si complété
  if (
    pathname === "/onboarding/profile/welcome" ||
    pathname === "/onboarding/profile"
  ) {
    if (user.isProfileCompleted || user.skipProfileSetup) {
      if (
        !user.isPreferenceCompleted &&
        !user.isPreferenceTerminated &&
        !user.skipPreferenceSetup
      ) {
        return NextResponse.redirect(
          new URL("/onboarding/preferences/welcome", request.url),
        );
      }
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  // Empêcher retour onboarding préférences si complété
  if (
    pathname === "/onboarding/preferences/welcome" ||
    pathname === "/onboarding/preferences"
  ) {
    if (
      user.isPreferenceCompleted ||
      user.isPreferenceTerminated ||
      user.skipPreferenceSetup
    ) {
      return NextResponse.redirect(new URL("/home", request.url));
    }

    if (!user.isProfileCompleted && !user.skipProfileSetup) {
      return NextResponse.redirect(
        new URL("/onboarding/profile/welcome", request.url),
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
