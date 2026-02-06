// lib/roles-config.ts
/**
 * 🎯 CONFIGURATION CENTRALISÉE DES RÔLES
 *
 * Définit les rôles de l'application et leurs permissions de navigation
 */

export const ROLES = {
  // 🔐 Rôles administratifs (accès au panneau admin)
  ADMIN: {
    ADMINISTRATOR: "administrator",
    MODERATOR: "moderator",
    ACCOUNTANT: "accountant",
    ASSISTANT: "assistant",
  },

  // 👤 Rôles utilisateurs (accès aux fonctionnalités standard)
  USER: {
    STANDARD: "standard_user",
    COMPANY: "company_user",
  },
} as const;

/**
 * Liste des rôles qui doivent accéder au panneau admin
 */
export const ADMIN_ROLES = [
  ROLES.ADMIN.ADMINISTRATOR,
  ROLES.ADMIN.MODERATOR,
  ROLES.ADMIN.ACCOUNTANT,
  ROLES.ADMIN.ASSISTANT,
] as const;

/**
 * Liste des rôles utilisateurs standard (accès /home)
 */
export const STANDARD_ROLES = [
  ROLES.USER.STANDARD,
  ROLES.USER.COMPANY,
] as const;

/**
 * Priorité des rôles (du plus important au moins important)
 * Utilisé pour déterminer le rôle principal si un utilisateur a plusieurs rôles
 */
export const ROLE_PRIORITY = [
  ROLES.ADMIN.ADMINISTRATOR,
  ROLES.ADMIN.MODERATOR,
  ROLES.ADMIN.ACCOUNTANT,
  ROLES.ADMIN.ASSISTANT,
  ROLES.USER.COMPANY,
  ROLES.USER.STANDARD,
] as const;

/**
 * Routes protégées nécessitant une authentification
 */
export const PROTECTED_ROUTES = [
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
  "/company",
] as const;

/**
 * Routes d'authentification (ne nécessitent pas d'être connecté)
 */
export const AUTH_ROUTES = [
  "/signin",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
] as const;

/**
 * Routes réservées aux admins
 */
export const ADMIN_ONLY_ROUTES = ["/admin"] as const;

/**
 * Routes réservées aux utilisateurs standard (non-admins)
 */
export const USER_ONLY_ROUTES = [
  "/home",
  "/discover",
  "/rencontres",
  "/videos",
  "/events",
] as const;

/**
 * Vérifie si un rôle est un rôle admin
 */
export function isAdminRole(roleName: string): boolean {
  return ADMIN_ROLES.includes(roleName as any);
}

/**
 * Vérifie si un rôle est un rôle utilisateur standard
 */
export function isStandardRole(roleName: string): boolean {
  return STANDARD_ROLES.includes(roleName as any);
}

/**
 * Récupère le rôle le plus prioritaire parmi une liste de rôles
 */
export function getPrimaryRole(roles: string[]): string | null {
  for (const priorityRole of ROLE_PRIORITY) {
    if (roles.includes(priorityRole)) {
      return priorityRole;
    }
  }
  return roles[0] || null;
}

/**
 * Détermine la route de redirection par défaut selon le rôle
 */
export function getDefaultRouteForRole(roleName: string): string {
  if (isAdminRole(roleName)) {
    return "/admin";
  }
  return "/home";
}
