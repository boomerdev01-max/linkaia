// lib/rbac.ts
import { prisma } from "./prisma";

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export async function userHasPermission(
  userId: string,
  permissionName: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return false;

    // Extraire toutes les permissions de tous les rôles de l'utilisateur
    const permissions = user.roles.flatMap((ur: { role: { permissions: any[]; }; }) =>
      ur.role.permissions.map((rp: { permission: { name: any; }; }) => rp.permission.name)
    );

    return permissions.includes(permissionName);
  } catch (error) {
    console.error("Erreur userHasPermission:", error);
    return false;
  }
}

/**
 * Récupère tous les rôles d'un utilisateur
 */
export async function getUserRoles(userId: string) {
  try {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    });

    return userRoles.map((ur: { role: any; }) => ur.role);
  } catch (error) {
    console.error("Erreur getUserRoles:", error);
    return [];
  }
}

/**
 * Récupère toutes les permissions d'un utilisateur (sans doublons)
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return [];

    // Extraire toutes les permissions (sans doublons)
    const permissions = user.roles.flatMap((ur: { role: { permissions: any[]; }; }) =>
      ur.role.permissions.map((rp) => rp.permission.name)
    );

    return [...new Set(permissions)];
  } catch (error) {
    console.error("Erreur getUserPermissions:", error);
    return [];
  }
}

/**
 * Récupère tous les menus accessibles par un utilisateur
 * avec la hiérarchie parent/enfant
 */
export async function getUserMenus(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: {
                      include: {
                        menus: {
                          include: {
                            menu: {
                              include: {
                                parent: true,
                                children: {
                                  include: {
                                    permissions: {
                                      include: {
                                        permission: true,
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return [];

    // Extraire tous les menus (avec gestion des doublons)
    const menusMap = new Map();

    user.roles.forEach((ur: { role: { permissions: any[]; }; }) => {
      ur.role.permissions.forEach((rp) => {
        rp.permission.menus.forEach((mp: { menu: any; }) => {
          const menu = mp.menu;
          if (!menusMap.has(menu.id)) {
            menusMap.set(menu.id, menu);
          }
        });
      });
    });

    // Convertir en array et trier par ordre
    const menus = Array.from(menusMap.values()).sort((a, b) => a.order - b.order);

    // Séparer les menus parents et enfants
    const parentMenus = menus.filter((m) => !m.parentId);
    const childMenus = menus.filter((m) => m.parentId);

    // Construire la hiérarchie
    return parentMenus.map((parent) => ({
      ...parent,
      children: childMenus
        .filter((child) => child.parentId === parent.id)
        .sort((a, b) => a.order - b.order),
    }));
  } catch (error) {
    console.error("Erreur getUserMenus:", error);
    return [];
  }
}

/**
 * Récupère toutes les actions accessibles par un utilisateur
 */
export async function getUserActions(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: {
                      include: {
                        actions: {
                          include: {
                            action: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return [];

    // Extraire toutes les actions
    const actionsMap = new Map();

    user.roles.forEach((ur: { role: { permissions: any[]; }; }) => {
      ur.role.permissions.forEach((rp) => {
        rp.permission.actions.forEach((pa: { action: any; }) => {
          const action = pa.action;
          if (!actionsMap.has(action.id)) {
            actionsMap.set(action.id, action);
          }
        });
      });
    });

    return Array.from(actionsMap.values());
  } catch (error) {
    console.error("Erreur getUserActions:", error);
    return [];
  }
}

/**
 * Vérifie si un utilisateur peut accéder à une action spécifique (method + endpoint)
 */
export async function userCanAccessAction(
  userId: string,
  method: string,
  endpoint: string
): Promise<boolean> {
  try {
    const actions = await getUserActions(userId);
    return actions.some(
      (action) => action.method === method && action.endpoint === endpoint
    );
  } catch (error) {
    console.error("Erreur userCanAccessAction:", error);
    return false;
  }
}

/**
 * Vérifie si un utilisateur est admin (a le rôle administrator)
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const roles = await getUserRoles(userId);
    return roles.some((role: { name: string; }) => role.name === "administrator");
  } catch (error) {
    console.error("Erreur isUserAdmin:", error);
    return false;
  }
}

/**
 * Vérifie si un utilisateur a un rôle staff (non standard_user)
 */
export async function isUserStaff(userId: string): Promise<boolean> {
  try {
    const roles = await getUserRoles(userId);
    return roles.some((role: { name: string; }) => role.name !== "standard_user");
  } catch (error) {
    console.error("Erreur isUserStaff:", error);
    return false;
  }
}

/**
 * Récupère le nom du rôle principal d'un utilisateur
 * (si plusieurs rôles, priorise administrator > moderator > accountant > assistant > standard_user)
 */
export async function getUserPrimaryRole(userId: string): Promise<string> {
  try {
    const roles = await getUserRoles(userId);
    
    if (roles.length === 0) return "standard_user";

    const rolePriority = ["administrator", "moderator", "accountant", "assistant", "standard_user"];
    
    for (const priority of rolePriority) {
      if (roles.some((role: { name: string; }) => role.name === priority)) {
        return priority;
      }
    }

    return roles[0].name;
  } catch (error) {
    console.error("Erreur getUserPrimaryRole:", error);
    return "standard_user";
  }
}

/**
 * Assigne un rôle à un utilisateur
 */
export async function assignRoleToUser(userId: string, roleName: string) {
  try {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    await prisma.userRole.create({
      data: {
        userId,
        roleId: role.id,
      },
    });

    return true;
  } catch (error) {
    console.error("Erreur assignRoleToUser:", error);
    return false;
  }
}

/**
 * Retire un rôle à un utilisateur
 */
export async function removeRoleFromUser(userId: string, roleName: string) {
  try {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
    });

    return true;
  } catch (error) {
    console.error("Erreur removeRoleFromUser:", error);
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// NOUVELLES FONCTIONS AJOUTÉES
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 🎭 Récupère le rôle principal d'un utilisateur
 * Priorité : administrator > moderator > accountant > assistant > company_user > standard_user
 */
export async function getUserPrimaryRoleNew(userId: string): Promise<string> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        select: {
          name: true,
        },
      },
    },
  });

  if (userRoles.length === 0) return "Aucun rôle";

  // Ordre de priorité (mis à jour avec company_user)
  const rolePriority = [
    "administrator",
    "moderator",
    "accountant",
    "assistant",
    "company_user",
    "standard_user",
  ];

  for (const priorityRole of rolePriority) {
    const found = userRoles.find((ur) => ur.role.name === priorityRole);
    if (found) {
      return found.role.name;
    }
  }

  return userRoles[0].role.name;
}

/**
 * 🏷️ Traduit le nom technique du rôle en français
 */
export function translateRole(roleName: string): string {
  const translations: Record<string, string> = {
    administrator: "Administrateur",
    moderator: "Modérateur",
    accountant: "Comptable",
    assistant: "Assistant",
    company_user: "Entreprise",
    standard_user: "Utilisateur",
  };
  return translations[roleName] || roleName;
}

/**
 * 🎨 Retourne la couleur du badge selon le rôle
 */
export function getRoleBadgeColor(roleName: string): string {
  const colors: Record<string, string> = {
    administrator: "bg-red-100 text-red-800 border-red-200",
    moderator: "bg-purple-100 text-purple-800 border-purple-200",
    accountant: "bg-blue-100 text-blue-800 border-blue-200",
    assistant: "bg-green-100 text-green-800 border-green-200",
    company_user: "bg-orange-100 text-orange-800 border-orange-200",
    standard_user: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[roleName] || "bg-gray-100 text-gray-800 border-gray-200";
}

/**
 * 🎨 Retourne la couleur du badge selon le niveau
 */
export function getLevelBadgeColor(level: string): string {
  const colors: Record<string, string> = {
    free: "bg-gray-100 text-gray-800 border-gray-200",
    premium: "bg-blue-100 text-blue-800 border-blue-200",
    platinium: "bg-purple-100 text-purple-800 border-purple-200",
    prestige: "bg-amber-100 text-amber-800 border-amber-200",
  };
  return colors[level] || "bg-gray-100 text-gray-800 border-gray-200";
}