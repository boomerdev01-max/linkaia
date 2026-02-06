import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

async function seedReportCategories() {
  console.log("⚠️ Seeding Report Categories...");

  const reportCategories = [
    {
      code: "inappropriate_content",
      label: "Contenu inapproprié",
      description: "Photos, vidéos ou messages à caractère inapproprié",
      order: 1,
    },
    {
      code: "harassment",
      label: "Harcèlement",
      description: "Comportement harcelant ou menaçant",
      order: 2,
    },
    {
      code: "fake_profile",
      label: "Faux profil",
      description: "Profil suspect ou usurpation d'identité",
      order: 3,
    },
    {
      code: "misleading_photos",
      label: "Photos trompeuses",
      description: "Photos qui ne correspondent pas à la personne",
      order: 4,
    },
    {
      code: "scam",
      label: "Arnaque",
      description: "Tentative d'escroquerie ou demande d'argent",
      order: 5,
    },
    {
      code: "spam",
      label: "Spam",
      description: "Messages publicitaires ou spam",
      order: 6,
    },
    {
      code: "underage",
      label: "Mineur",
      description: "Profil d'une personne mineure",
      order: 7,
    },
    {
      code: "hate_speech",
      label: "Discours haineux",
      description: "Propos racistes, homophobes ou discriminatoires",
      order: 8,
    },
    {
      code: "suspicious_behavior",
      label: "Comportement suspect",
      description: "Comportement étrange ou suspect",
      order: 9,
    },
    {
      code: "other",
      label: "Autre",
      description: "Autre motif de signalement",
      order: 10,
    },
  ];

  for (const category of reportCategories) {
    await prisma.reportCategory.upsert({
      where: { code: category.code },
      update: {
        label: category.label,
        description: category.description,
        order: category.order,
        isActive: true,
      },
      create: {
        code: category.code,
        label: category.label,
        description: category.description,
        order: category.order,
        isActive: true,
      },
    });
  }

  console.log(`✅ ${reportCategories.length} catégories de signalement créées`);
}

async function seedChatData() {
  console.log("💬 Seeding Message Reaction Types...");

  // Pas besoin de table séparée pour les réactions messages
  // On utilise directement les emojis dans MessageReaction

  // Les emojis autorisés : 👍, ❤️, 😂, 😮, 😢, 🙏
  // Ils seront validés côté API

  console.log("✅ Message Reaction Types configured");
}

async function seedRBAC() {
  console.log("🔐 Seeding RBAC System...");

  // ============================================
  // 1. ROLES
  // ============================================
  console.log("👥 Creating Roles...");

  const rolesData = [
    {
      name: "standard_user",
      description:
        "Utilisateur standard avec accès aux fonctionnalités de base",
    },
    {
      name: "administrator",
      description: "Administrateur avec accès complet au système",
    },
    {
      name: "assistant",
      description: "Assistant avec accès limité aux fonctionnalités de support",
    },
    {
      name: "accountant",
      description: "Comptable avec accès aux fonctionnalités financières",
    },
    {
      name: "moderator",
      description: "Modérateur avec accès à la gestion du contenu",
    },
  ];

  const roles: Record<string, any> = {};
  for (const roleData of rolesData) {
    roles[roleData.name] = await prisma.role.upsert({
      where: { name: roleData.name },
      update: roleData,
      create: roleData,
    });
  }

  console.log("✅ Roles created");

  // ============================================
  // 2. PERMISSIONS
  // ============================================
  console.log("🔑 Creating Permissions...");

  const permissionsData = [
    // Gestion Utilisateurs
    { name: "user.read", description: "Consulter les utilisateurs" },
    { name: "user.create", description: "Créer des utilisateurs" },
    { name: "user.update", description: "Modifier les utilisateurs" },
    { name: "user.delete", description: "Supprimer les utilisateurs" },
    { name: "user.list", description: "Lister les utilisateurs" },
    { name: "user.profile", description: "Consulter les profils détaillés" },

    // Gestion Rôles & Permissions
    { name: "role.read", description: "Consulter les rôles" },
    { name: "role.create", description: "Créer des rôles" },
    { name: "role.update", description: "Modifier les rôles" },
    { name: "role.delete", description: "Supprimer les rôles" },
    { name: "permission.manage", description: "Gérer les permissions" },

    // Gestion Contenu
    { name: "post.read", description: "Consulter les posts" },
    { name: "post.moderate", description: "Modérer les posts" },
    { name: "post.delete", description: "Supprimer les posts" },
    { name: "comment.moderate", description: "Modérer les commentaires" },
    { name: "media.moderate", description: "Modérer les médias" },

    // Gestion Financière
    { name: "transaction.read", description: "Consulter les transactions" },
    { name: "transaction.create", description: "Créer des transactions" },
    { name: "invoice.read", description: "Consulter les factures" },
    { name: "invoice.create", description: "Créer des factures" },
    { name: "invoice.update", description: "Modifier les factures" },
    {
      name: "statistics.view",
      description: "Consulter les statistiques financières",
    },

    // Gestion Communication
    { name: "notification.send", description: "Envoyer des notifications" },
    { name: "email.send", description: "Envoyer des emails" },

    // Configuration système
    { name: "system.config", description: "Configurer le système" },
    { name: "system.logs", description: "Consulter les logs" },

    // Codes Prestige
    { name: "prestige.manage", description: "Gérer les codes prestige" },

    // Dashboard & Rapports
    { name: "dashboard.view", description: "Accéder au dashboard admin" },
    { name: "reports.view", description: "Consulter les rapports" },
    { name: "reports.export", description: "Exporter les rapports" },
  ];

  const permissions: Record<string, any> = {};
  for (const permData of permissionsData) {
    permissions[permData.name] = await prisma.permission.upsert({
      where: { name: permData.name },
      update: permData,
      create: permData,
    });
  }

  console.log("✅ Permissions created");

  // ============================================
  // 3. ACTIONS (API Endpoints)
  // ============================================
  console.log("⚡ Creating Actions...");

  const actionsData = [
    // Users
    {
      method: "GET",
      endpoint: "/api/admin/users",
      description: "Liste des utilisateurs",
    },
    {
      method: "GET",
      endpoint: "/api/admin/users/:id",
      description: "Détails utilisateur",
    },
    {
      method: "POST",
      endpoint: "/api/admin/users",
      description: "Créer utilisateur",
    },
    {
      method: "PUT",
      endpoint: "/api/admin/users/:id",
      description: "Modifier utilisateur",
    },
    {
      method: "DELETE",
      endpoint: "/api/admin/users/:id",
      description: "Supprimer utilisateur",
    },

    // Roles
    {
      method: "GET",
      endpoint: "/api/admin/roles",
      description: "Liste des rôles",
    },
    { method: "POST", endpoint: "/api/admin/roles", description: "Créer rôle" },
    {
      method: "PUT",
      endpoint: "/api/admin/roles/:id",
      description: "Modifier rôle",
    },
    {
      method: "DELETE",
      endpoint: "/api/admin/roles/:id",
      description: "Supprimer rôle",
    },

    // Posts
    {
      method: "GET",
      endpoint: "/api/admin/posts",
      description: "Liste des posts",
    },
    {
      method: "DELETE",
      endpoint: "/api/admin/posts/:id",
      description: "Supprimer post",
    },

    // Transactions
    {
      method: "GET",
      endpoint: "/api/admin/transactions",
      description: "Liste des transactions",
    },
    {
      method: "GET",
      endpoint: "/api/admin/statistics",
      description: "Statistiques",
    },

    // Dashboard
    {
      method: "GET",
      endpoint: "/api/admin/dashboard",
      description: "Dashboard data",
    },
  ];

  const actions: Record<string, any> = {};
  for (const actionData of actionsData) {
    const key = `${actionData.method}:${actionData.endpoint}`;
    actions[key] = await prisma.action.upsert({
      where: {
        method_endpoint: {
          method: actionData.method,
          endpoint: actionData.endpoint,
        },
      },
      update: actionData,
      create: actionData,
    });
  }

  console.log("✅ Actions created");

  // ============================================
// 4. MENUS (synchronisés avec adminConfig)
// ============================================
console.log("📋 Creating Menus...");

// Menus Parents - ❌ RETIRER LES PATHS
const menuUsers = await prisma.menu.upsert({
  where: { name: "Utilisateurs" },
  update: { path: null, icon: "Users", order: 1 }, // ✅ path: null
  create: {
    name: "Utilisateurs",
    path: null, // ✅ Pas de redirection
    icon: "Users",
    order: 1,
  },
});

const menuContent = await prisma.menu.upsert({
  where: { name: "Gestion de contenu" },
  update: { path: null, icon: "ImageIcon", order: 2 },
  create: {
    name: "Gestion de contenu",
    path: null,
    icon: "ImageIcon",
    order: 2,
  },
});

const menuServices = await prisma.menu.upsert({
  where: { name: "Services & Paiements" },
  update: { path: null, icon: "CreditCard", order: 3 },
  create: {
    name: "Services & Paiements",
    path: null,
    icon: "CreditCard",
    order: 3,
  },
});

const menuStats = await prisma.menu.upsert({
  where: { name: "Statistiques & Rapports" },
  update: { path: null, icon: "BarChart3", order: 4 },
  create: {
    name: "Statistiques & Rapports",
    path: null,
    icon: "BarChart3",
    order: 4,
  },
});

const menuComm = await prisma.menu.upsert({
  where: { name: "Communication" },
  update: { path: null, icon: "Bell", order: 5 },
  create: {
    name: "Communication",
    path: null,
    icon: "Bell",
    order: 5,
  },
});

const menuConfig = await prisma.menu.upsert({
  where: { name: "Configuration système" },
  update: { path: null, icon: "Settings", order: 6 },
  create: {
    name: "Configuration système",
    path: null,
    icon: "Settings",
    order: 6,
  },
});

const menuFinance = await prisma.menu.upsert({
  where: { name: "Finances" },
  update: { path: null, icon: "Wallet", order: 7 },
  create: {
    name: "Finances",
    path: null,
    icon: "Wallet",
    order: 7,
  },
});

// Sous-Menus - ✅ GARDER LES PATHS
// (Le reste de ton code reste identique)

  // Sous-Menus
  await prisma.menu.upsert({
    where: { name: "Profils Utilisateurs" },
    update: {
      path: "/admin/users/profiles",
      icon: "UserCheck",
      parentId: menuUsers.id,
      order: 1,
    },
    create: {
      name: "Profils Utilisateurs",
      path: "/admin/users/profiles",
      icon: "UserCheck",
      parentId: menuUsers.id,
      order: 1,
    },
  });

  await prisma.menu.upsert({
    where: { name: "Rôles & Permissions" },
    update: {
      path: "/admin/users/roles",
      icon: "Shield",
      parentId: menuUsers.id,
      order: 2,
    },
    create: {
      name: "Rôles & Permissions",
      path: "/admin/users/roles",
      icon: "Shield",
      parentId: menuUsers.id,
      order: 2,
    },
  });

  await prisma.menu.upsert({
    where: { name: "Codes Prestige" },
    update: {
      path: "/admin/prestige-codes",
      icon: "Crown",
      parentId: menuUsers.id,
      order: 3,
    },
    create: {
      name: "Codes Prestige",
      path: "/admin/prestige-codes",
      icon: "Crown",
      parentId: menuUsers.id,
      order: 3,
    },
  });

  await prisma.menu.upsert({
    where: { name: "Médias en Attente" },
    update: {
      path: "/admin/content/pending-media",
      icon: "FileImage",
      parentId: menuContent.id,
      order: 1,
    },
    create: {
      name: "Médias en Attente",
      path: "/admin/content/pending-media",
      icon: "FileImage",
      parentId: menuContent.id,
      order: 1,
    },
  });

  await prisma.menu.upsert({
    where: { name: "Transactions" },
    update: {
      path: "/admin/services/transactions",
      icon: "Receipt",
      parentId: menuServices.id,
      order: 1,
    },
    create: {
      name: "Transactions",
      path: "/admin/services/transactions",
      icon: "Receipt",
      parentId: menuServices.id,
      order: 1,
    },
  });

  await prisma.menu.upsert({
    where: { name: "Statistiques Services" },
    update: {
      path: "/admin/services/statistics",
      icon: "TrendingUp",
      parentId: menuServices.id,
      order: 2,
    },
    create: {
      name: "Statistiques Services",
      path: "/admin/services/statistics",
      icon: "TrendingUp",
      parentId: menuServices.id,
      order: 2,
    },
  });

  await prisma.menu.upsert({
    where: { name: "Revenus & Statistiques" },
    update: {
      path: "/admin/stats/reports",
      icon: "TrendingUp",
      parentId: menuStats.id,
      order: 1,
    },
    create: {
      name: "Revenus & Statistiques",
      path: "/admin/stats/reports",
      icon: "TrendingUp",
      parentId: menuStats.id,
      order: 1,
    },
  });

  await prisma.menu.upsert({
    where: { name: "Notifications & E-mails" },
    update: {
      path: "/admin/communication/notifications",
      icon: "Mail",
      parentId: menuComm.id,
      order: 1,
    },
    create: {
      name: "Notifications & E-mails",
      path: "/admin/communication/notifications",
      icon: "Mail",
      parentId: menuComm.id,
      order: 1,
    },
  });

  await prisma.menu.upsert({
    where: { name: "Administration" },
    update: {
      path: "/admin/config/administration",
      icon: "Wrench",
      parentId: menuConfig.id,
      order: 1,
    },
    create: {
      name: "Administration",
      path: "/admin/config/administration",
      icon: "Wrench",
      parentId: menuConfig.id,
      order: 1,
    },
  });

  await prisma.menu.upsert({
    where: { name: "Demandes & Factures" },
    update: {
      path: "/admin/finance/invoices",
      icon: "Receipt",
      parentId: menuFinance.id,
      order: 1,
    },
    create: {
      name: "Demandes & Factures",
      path: "/admin/finance/invoices",
      icon: "Receipt",
      parentId: menuFinance.id,
      order: 1,
    },
  });

  console.log("✅ Menus created");

  // ============================================
  // 5. ASSOCIATIONS ROLE-PERMISSIONS
  // ============================================
  console.log("🔗 Creating Role-Permission associations...");

  // Administrator - FULL ACCESS
  const adminPermissions = Object.keys(permissions);
  for (const permKey of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles.administrator.id,
          permissionId: permissions[permKey].id,
        },
      },
      update: {},
      create: {
        roleId: roles.administrator.id,
        permissionId: permissions[permKey].id,
      },
    });
  }

  // Moderator - Content moderation
  const moderatorPerms = [
    "dashboard.view",
    "post.read",
    "post.moderate",
    "post.delete",
    "comment.moderate",
    "media.moderate",
    "user.read",
    "user.list",
  ];
  for (const permKey of moderatorPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles.moderator.id,
          permissionId: permissions[permKey].id,
        },
      },
      update: {},
      create: {
        roleId: roles.moderator.id,
        permissionId: permissions[permKey].id,
      },
    });
  }

  // Accountant - Finance only
  const accountantPerms = [
    "dashboard.view",
    "transaction.read",
    "transaction.create",
    "invoice.read",
    "invoice.create",
    "invoice.update",
    "statistics.view",
    "reports.view",
    "reports.export",
  ];
  for (const permKey of accountantPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles.accountant.id,
          permissionId: permissions[permKey].id,
        },
      },
      update: {},
      create: {
        roleId: roles.accountant.id,
        permissionId: permissions[permKey].id,
      },
    });
  }

  // Assistant - Limited support
  const assistantPerms = [
    "dashboard.view",
    "user.read",
    "user.list",
    "user.profile",
    "post.read",
    "transaction.read",
  ];
  for (const permKey of assistantPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles.assistant.id,
          permissionId: permissions[permKey].id,
        },
      },
      update: {},
      create: {
        roleId: roles.assistant.id,
        permissionId: permissions[permKey].id,
      },
    });
  }

  console.log("✅ Role-Permission associations created");

  // ============================================
  // 6. ASSOCIATIONS PERMISSION-ACTIONS
  // ============================================
  console.log("🔗 Creating Permission-Action associations...");

  const permActionMap = {
    "user.list": ["GET:/api/admin/users"],
    "user.read": ["GET:/api/admin/users/:id"],
    "user.create": ["POST:/api/admin/users"],
    "user.update": ["PUT:/api/admin/users/:id"],
    "user.delete": ["DELETE:/api/admin/users/:id"],
    "role.read": ["GET:/api/admin/roles"],
    "role.create": ["POST:/api/admin/roles"],
    "role.update": ["PUT:/api/admin/roles/:id"],
    "role.delete": ["DELETE:/api/admin/roles/:id"],
    "post.read": ["GET:/api/admin/posts"],
    "post.delete": ["DELETE:/api/admin/posts/:id"],
    "transaction.read": ["GET:/api/admin/transactions"],
    "statistics.view": ["GET:/api/admin/statistics"],
    "dashboard.view": ["GET:/api/admin/dashboard"],
  };

  for (const [permKey, actionKeys] of Object.entries(permActionMap)) {
    for (const actionKey of actionKeys) {
      if (actions[actionKey]) {
        await prisma.permissionAction.upsert({
          where: {
            permissionId_actionId: {
              permissionId: permissions[permKey].id,
              actionId: actions[actionKey].id,
            },
          },
          update: {},
          create: {
            permissionId: permissions[permKey].id,
            actionId: actions[actionKey].id,
          },
        });
      }
    }
  }

  console.log("✅ Permission-Action associations created");

  // ============================================
  // 7. ASSOCIATIONS MENU-PERMISSIONS
  // ============================================
  console.log("🔗 Creating Menu-Permission associations...");

  const allMenus = await prisma.menu.findMany();
  const menuPermMap: Record<string, string[]> = {
    Utilisateurs: ["user.read", "user.list"],
    "Profils Utilisateurs": ["user.read", "user.profile"],
    "Rôles & Permissions": ["role.read", "permission.manage"],
    "Codes Prestige": ["prestige.manage"],
    "Gestion de contenu": ["post.read", "media.moderate"],
    "Médias en Attente": ["media.moderate"],
    "Services & Paiements": ["transaction.read"],
    Transactions: ["transaction.read", "transaction.create"],
    "Statistiques Services": ["statistics.view"],
    "Statistiques & Rapports": ["reports.view"],
    "Revenus & Statistiques": ["reports.view", "reports.export"],
    Communication: ["notification.send", "email.send"],
    "Notifications & E-mails": ["notification.send", "email.send"],
    "Configuration système": ["system.config"],
    Administration: ["system.config", "system.logs"],
    Finances: ["invoice.read"],
    "Demandes & Factures": ["invoice.read", "invoice.create", "invoice.update"],
  };

  for (const menu of allMenus) {
    const permKeys = menuPermMap[menu.name] || [];
    for (const permKey of permKeys) {
      if (permissions[permKey]) {
        await prisma.menuPermission.upsert({
          where: {
            menuId_permissionId: {
              menuId: menu.id,
              permissionId: permissions[permKey].id,
            },
          },
          update: {},
          create: {
            menuId: menu.id,
            permissionId: permissions[permKey].id,
          },
        });
      }
    }
  }

  console.log("✅ Menu-Permission associations created");

  // ============================================
  // 8. CRÉER UN ADMIN PAR DÉFAUT
  // ============================================
  console.log("👤 Creating default admin user...");

  const adminEmail = "admin@linkaia.com";
  const adminPassword = "Admin@123";

  // Vérifier si l'admin existe déjà
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    // 1️⃣ Créer l'utilisateur dans Supabase Auth FIRST
    const { createSupabaseAuthUser } =
      await import("@/lib/supabase/admin-client");

    console.log("📝 Creating admin in Supabase Auth...");

    try {
      const supabaseUser = await createSupabaseAuthUser(
        adminEmail,
        adminPassword,
        { nom: "Admin", prenom: "System" },
        true, // emailConfirmed = true (pas besoin de vérification)
      );

      // 2️⃣ Créer l'utilisateur dans Prisma avec le supabaseId
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      adminUser = await prisma.user.create({
        data: {
          nom: "Admin",
          prenom: "System",
          email: adminEmail,
          password: hashedPassword, // Hash Prisma (pour cohérence)
          supabaseId: supabaseUser.id, // ✅ CLEF : Lier à Supabase
          provider: "email",
          emailVerified: true,
          adminCreated: true,
          isFirstLogin: true,
          mustChangePassword: false,
          level: "free",
        },
      });

      console.log(
        `✅ Admin user created in Prisma with supabaseId: ${supabaseUser.id}`,
      );
    } catch (error: any) {
      if (error?.message?.includes("User already registered")) {
        console.log("⚠️  Admin email already exists in Supabase Auth");
        console.log(
          "💡 You need to manually link this user or delete from Supabase first",
        );
        throw error;
      } else {
        throw error;
      }
    }
  } else {
    console.log("ℹ️ Admin user already exists in Prisma");

    // Si l'admin existe mais n'a pas de supabaseId (ancien seed), le corriger
    if (!adminUser.supabaseId) {
      console.log(
        "⚠️ Admin exists but has no supabaseId. Attempting to fix...",
      );

      const { createSupabaseAuthUser, getSupabaseUserByEmail } =
        await import("@/lib/supabase/admin-client");

      try {
        // Vérifier si l'utilisateur existe déjà dans Supabase
        const existingSupabaseUser = await getSupabaseUserByEmail(adminEmail);

        if (existingSupabaseUser) {
          // L'utilisateur existe dans Supabase, juste mettre à jour le lien
          console.log(
            `📎 Linking existing Supabase user: ${existingSupabaseUser.id}`,
          );

          adminUser = await prisma.user.update({
            where: { email: adminEmail },
            data: {
              supabaseId: existingSupabaseUser.id,
              emailVerified: true,
            },
          });

          console.log(
            `✅ Admin linked with supabaseId: ${existingSupabaseUser.id}`,
          );
        } else {
          // L'utilisateur n'existe pas dans Supabase, le créer
          console.log("📝 Creating admin in Supabase Auth...");

          const supabaseUser = await createSupabaseAuthUser(
            adminEmail,
            adminPassword,
            { nom: adminUser.nom, prenom: adminUser.prenom },
            true,
          );

          adminUser = await prisma.user.update({
            where: { email: adminEmail },
            data: {
              supabaseId: supabaseUser.id,
              emailVerified: true,
            },
          });

          console.log(`✅ Admin fixed with new supabaseId: ${supabaseUser.id}`);
        }
      } catch (error) {
        console.error("❌ Failed to fix admin sync:", error);
        throw error;
      }
    } else {
      console.log(`✅ Admin already has supabaseId: ${adminUser.supabaseId}`);
    }
  }

  // Assigner le rôle administrator
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: roles.administrator.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: roles.administrator.id,
    },
  });

  console.log("✅ Default admin user ready (admin@linkaia.com / Admin@123)");
  console.log("🔐 IMPORTANT: Change the admin password after first login!");
  console.log("🎉 RBAC System seeded successfully!");
}

async function seedCompanyRoles() {
  console.log("🏢 Seeding Company Roles...");

  // Créer le rôle company_user
  const companyUserRole = await prisma.role.upsert({
    where: { name: "company_user" },
    update: {
      description:
        "Utilisateur de type entreprise avec accès aux fonctionnalités business",
    },
    create: {
      name: "company_user",
      description:
        "Utilisateur de type entreprise avec accès aux fonctionnalités business",
    },
  });

  console.log(`✅ Role company_user created: ${companyUserRole.id}`);

  // Permissions pour company_user (similaires à standard_user pour l'instant)
  const companyUserPerms = [
    "dashboard.view",
    "user.read",
    "user.profile",
    "post.read",
    "notification.send",
  ];

  for (const permKey of companyUserPerms) {
    const permission = await prisma.permission.findUnique({
      where: { name: permKey },
    });

    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: companyUserRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: companyUserRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log("✅ Company user permissions assigned");
}

async function seedSubscriptions() {
  console.log("💰 Seeding Subscriptions...");

  // Devises
  const xof = await prisma.currency.upsert({
    where: { code: "XOF" },
    update: {},
    create: { code: "XOF", symbol: "CFA", name: "Franc CFA", isActive: true },
  });

  const eur = await prisma.currency.upsert({
    where: { code: "EUR" },
    update: {},
    create: { code: "EUR", symbol: "€", name: "Euro", isActive: true },
  });

  const usd = await prisma.currency.upsert({
    where: { code: "USD" },
    update: {},
    create: { code: "USD", symbol: "$", name: "Dollar", isActive: true },
  });

  console.log("✅ Currencies created");

  // Types d'abonnements
  const subscriptionTypes = [
    {
      code: "FREE",
      name: "Gratuit",
      description: "Accès de base à la plateforme",
      priceMonth: 0,
      priceYear: 0,
      currencyId: xof.code,
      color: "#6B7280",
      icon: "user",
      order: 1,
      features: [
        {
          key: "match_range",
          value: "20-50",
          description: "Voir les matchs de 20% à 50%",
        },
        {
          key: "daily_matches",
          value: "10",
          description: "10 suggestions par jour",
        },
        { key: "messages", value: "limited", description: "Messages limités" },
        {
          key: "profile_boost",
          value: "false",
          description: "Pas de boost de profil",
        },
      ],
    },
    {
      code: "VIP",
      name: "VIP",
      description: "Expérience améliorée pour rencontres sérieuses",
      priceMonth: 2500,
      priceYear: 25000,
      currencyId: xof.code,
      color: "#C0C0C0",
      icon: "star",
      order: 2,
      features: [
        {
          key: "match_range",
          value: "20-90",
          description: "Voir les matchs de 20% à 90%",
        },
        {
          key: "daily_matches",
          value: "50",
          description: "50 suggestions par jour",
        },
        {
          key: "messages",
          value: "unlimited",
          description: "Messages illimités",
        },
        {
          key: "profile_boost",
          value: "true",
          description: "Boost de profil mensuel",
        },
        {
          key: "badge_visible",
          value: "true",
          description: "Badge VIP visible",
        },
        { key: "badge_label", value: "VIP", description: "Label du badge" },
      ],
    },
    {
      code: "PLATINUM",
      name: "Platinum",
      description: "Expérience ultime, accès complet",
      priceMonth: 5000,
      priceYear: 50000,
      currencyId: xof.code,
      color: "#FFD700",
      icon: "crown",
      order: 3,
      features: [
        {
          key: "match_range",
          value: "20-100",
          description: "Voir TOUS les matchs (20% à 100%)",
        },
        {
          key: "daily_matches",
          value: "unlimited",
          description: "Suggestions illimitées",
        },
        {
          key: "messages",
          value: "unlimited",
          description: "Messages illimités",
        },
        {
          key: "profile_boost",
          value: "true",
          description: "Boost prioritaire quotidien",
        },
        {
          key: "badge_visible",
          value: "true",
          description: "Badge Platinum visible",
        },
        {
          key: "badge_label",
          value: "PLATINUM",
          description: "Label du badge",
        },
        {
          key: "advanced_filters",
          value: "true",
          description: "Filtres avancés",
        },
        {
          key: "priority_matching",
          value: "true",
          description: "Matching prioritaire",
        },
        {
          key: "new_profiles_exclusive",
          value: "true",
          description: "Accès exclusif aux nouveaux profils",
        },
      ],
    },
  ];

  for (const subType of subscriptionTypes) {
    const createdSubType = await prisma.subscriptionType.upsert({
      where: { code: subType.code },
      update: {
        name: subType.name,
        description: subType.description,
        priceMonth: subType.priceMonth,
        priceYear: subType.priceYear,
        color: subType.color,
        icon: subType.icon,
        order: subType.order,
      },
      create: {
        code: subType.code,
        name: subType.name,
        description: subType.description,
        priceMonth: subType.priceMonth,
        priceYear: subType.priceYear,
        currencyId: subType.currencyId,
        color: subType.color,
        icon: subType.icon,
        order: subType.order,
        isActive: true,
      },
    });

    // Supprimer anciennes features et recréer
    await prisma.subscriptionFeature.deleteMany({
      where: { subscriptionTypeId: createdSubType.id },
    });

    for (const feature of subType.features) {
      await prisma.subscriptionFeature.create({
        data: {
          subscriptionTypeId: createdSubType.id,
          featureKey: feature.key,
          featureValue: feature.value,
          description: feature.description,
        },
      });
    }
  }

  console.log("✅ Subscription types and features created");
}

async function main() {
  console.log("🌱 Starting seed...");

  // RBAC d'abord, puis Souscriptions
  await seedRBAC();
  await seedCompanyRoles();
  await seedSubscriptions();
  await seedReportCategories();

  // ============================================
  // 1. REACTION TYPES
  // ============================================
  console.log("😊 Seeding Reaction Types...");

  const reactionTypes = [
    {
      code: "support",
      label: "Soutien",
      emoji: "✊",
      order: 1,
    },
    {
      code: "love",
      label: "J'adore",
      emoji: "💖",
      order: 2,
    },
    {
      code: "laugh",
      label: "Rire",
      emoji: "😂",
      order: 3,
    },
    {
      code: "wow",
      label: "Waoh",
      emoji: "🤯",
      order: 4,
    },
    {
      code: "sad",
      label: "Touché",
      emoji: "🥺",
      order: 5,
    },
    {
      code: "angry",
      label: "Furieux",
      emoji: "😡",
      order: 6,
    },
  ];

  for (const reaction of reactionTypes) {
    await prisma.reactionType.upsert({
      where: { code: reaction.code },
      update: reaction,
      create: reaction,
    });
  }

  console.log("✅ Reaction Types seeded");

  // ============================================
  // 2. CENTRES D'INTÉRÊT (Inspirés de Badoo)
  // ============================================
  console.log("📚 Seeding Interest Categories & Interests...");

  const interestCategoriesData = [
    {
      name: "Sorties",
      emoji: "🎉",
      order: 1,
      interests: [
        { name: "Bars", emoji: "🍺" },
        { name: "Boîte de nuit", emoji: "🔊" },
        { name: "Brunch le week-end", emoji: "🥞" },
        { name: "Brunchs sans fin", emoji: "🍾" },
        { name: "Concerts", emoji: "🎤" },
        { name: "Dîners entre amis", emoji: "🍽️" },
        { name: "Festivals", emoji: "🎪" },
        { name: "Galeries d'art", emoji: "🖼️" },
      ],
    },
    {
      name: "Style de vie",
      emoji: "✨",
      order: 2,
      interests: [
        { name: "Amateur d'art", emoji: "🎨" },
        { name: "Amour des animaux", emoji: "🐱" },
        { name: "Animal de compagnie", emoji: "🐶" },
        { name: "Apprenant permanent", emoji: "📚" },
        { name: "Astrologie", emoji: "⭐" },
        { name: "Audace", emoji: "😎" },
        { name: "Bronzette", emoji: "☀️" },
        { name: "Cinéma", emoji: "🎬" },
        { name: "Cuisine", emoji: "👨‍🍳" },
        { name: "DIY", emoji: "🔨" },
        { name: "Écologie", emoji: "🌱" },
        { name: "Jardinage", emoji: "🌿" },
        { name: "Mode", emoji: "👗" },
        { name: "Musique live", emoji: "🎸" },
        { name: "Photographie", emoji: "📷" },
        { name: "Shopping", emoji: "🛍️" },
        { name: "Végétarien", emoji: "🥗" },
        { name: "Vintage", emoji: "📻" },
      ],
    },
    {
      name: "Sport & Fitness",
      emoji: "💪",
      order: 3,
      interests: [
        { name: "Basket", emoji: "🏀" },
        { name: "Course à pied", emoji: "🏃" },
        { name: "Cyclisme", emoji: "🚴" },
        { name: "Danse", emoji: "💃" },
        { name: "Escalade", emoji: "🧗" },
        { name: "Football", emoji: "⚽" },
        { name: "Gym", emoji: "🏋️" },
        { name: "Natation", emoji: "🏊" },
        { name: "Randonnée", emoji: "🥾" },
        { name: "Skateboard", emoji: "🛹" },
        { name: "Surf", emoji: "🏄" },
        { name: "Tennis", emoji: "🎾" },
        { name: "Yoga", emoji: "🧘" },
      ],
    },
    {
      name: "Culture & Divertissement",
      emoji: "📖",
      order: 4,
      interests: [
        { name: "BD & Manga", emoji: "📚" },
        { name: "Comédie", emoji: "🤣" },
        { name: "Jeux de société", emoji: "🎲" },
        { name: "Jeux vidéo", emoji: "🎮" },
        { name: "Lecture", emoji: "📖" },
        { name: "Musées", emoji: "🏛️" },
        { name: "Netflix", emoji: "📺" },
        { name: "Podcasts", emoji: "🎙️" },
        { name: "Séries TV", emoji: "📺" },
        { name: "Théâtre", emoji: "🎭" },
      ],
    },
    {
      name: "Voyage",
      emoji: "✈️",
      order: 5,
      interests: [
        { name: "Aventure", emoji: "🗺️" },
        { name: "Backpacking", emoji: "🎒" },
        { name: "Camping", emoji: "⛺" },
        { name: "City trips", emoji: "🏙️" },
        { name: "Découverte culturelle", emoji: "🌍" },
        { name: "Plage", emoji: "🏖️" },
        { name: "Road trips", emoji: "🚗" },
        { name: "Voyager", emoji: "✈️" },
      ],
    },
    {
      name: "Créativité",
      emoji: "🎨",
      order: 6,
      interests: [
        { name: "Blogging", emoji: "✍️" },
        { name: "Dessin", emoji: "✏️" },
        { name: "Écriture", emoji: "📝" },
        { name: "Graphisme", emoji: "🖌️" },
        { name: "Musique", emoji: "🎵" },
        { name: "Peinture", emoji: "🎨" },
        { name: "Poésie", emoji: "📜" },
      ],
    },
  ];

  for (const catData of interestCategoriesData) {
    const category = await prisma.interestCategory.upsert({
      where: { name: catData.name },
      update: { emoji: catData.emoji, order: catData.order },
      create: {
        name: catData.name,
        emoji: catData.emoji,
        order: catData.order,
      },
    });

    for (const interestData of catData.interests) {
      await prisma.interest.upsert({
        where: {
          name_categoryId: {
            name: interestData.name,
            categoryId: category.id,
          },
        },
        update: { emoji: interestData.emoji },
        create: {
          name: interestData.name,
          emoji: interestData.emoji,
          categoryId: category.id,
        },
      });
    }
  }

  console.log("✅ Interest Categories & Interests seeded");

  // ============================================
  // 3. NATIONALITÉS (Top 50 pays)
  // ============================================
  console.log("🌍 Seeding Nationalities...");

  const nationalitiesData = [
    { code: "FR", nameFr: "Française", nameEn: "French", flag: "🇫🇷" },
    { code: "US", nameFr: "Américaine", nameEn: "American", flag: "🇺🇸" },
    { code: "GB", nameFr: "Britannique", nameEn: "British", flag: "🇬🇧" },
    { code: "ES", nameFr: "Espagnole", nameEn: "Spanish", flag: "🇪🇸" },
    { code: "IT", nameFr: "Italienne", nameEn: "Italian", flag: "🇮🇹" },
    { code: "DE", nameFr: "Allemande", nameEn: "German", flag: "🇩🇪" },
    { code: "PT", nameFr: "Portugaise", nameEn: "Portuguese", flag: "🇵🇹" },
    { code: "BE", nameFr: "Belge", nameEn: "Belgian", flag: "🇧🇪" },
    { code: "CH", nameFr: "Suisse", nameEn: "Swiss", flag: "🇨🇭" },
    { code: "CA", nameFr: "Canadienne", nameEn: "Canadian", flag: "🇨🇦" },
    { code: "BR", nameFr: "Brésilienne", nameEn: "Brazilian", flag: "🇧🇷" },
    { code: "MX", nameFr: "Mexicaine", nameEn: "Mexican", flag: "🇲🇽" },
    { code: "AR", nameFr: "Argentine", nameEn: "Argentinian", flag: "🇦🇷" },
    { code: "MA", nameFr: "Marocaine", nameEn: "Moroccan", flag: "🇲🇦" },
    { code: "DZ", nameFr: "Algérienne", nameEn: "Algerian", flag: "🇩🇿" },
    { code: "TN", nameFr: "Tunisienne", nameEn: "Tunisian", flag: "🇹🇳" },
    { code: "SN", nameFr: "Sénégalaise", nameEn: "Senegalese", flag: "🇸🇳" },
    { code: "CI", nameFr: "Ivoirienne", nameEn: "Ivorian", flag: "🇨🇮" },
    { code: "CM", nameFr: "Camerounaise", nameEn: "Cameroonian", flag: "🇨🇲" },
    { code: "BJ", nameFr: "Béninoise", nameEn: "Beninese", flag: "🇧🇯" },
    { code: "CN", nameFr: "Chinoise", nameEn: "Chinese", flag: "🇨🇳" },
    { code: "JP", nameFr: "Japonaise", nameEn: "Japanese", flag: "🇯🇵" },
    { code: "IN", nameFr: "Indienne", nameEn: "Indian", flag: "🇮🇳" },
    { code: "RU", nameFr: "Russe", nameEn: "Russian", flag: "🇷🇺" },
    { code: "TR", nameFr: "Turque", nameEn: "Turkish", flag: "🇹🇷" },
    { code: "EG", nameFr: "Égyptienne", nameEn: "Egyptian", flag: "🇪🇬" },
    {
      code: "ZA",
      nameFr: "Sud-Africaine",
      nameEn: "South African",
      flag: "🇿🇦",
    },
    { code: "AU", nameFr: "Australienne", nameEn: "Australian", flag: "🇦🇺" },
    {
      code: "NZ",
      nameFr: "Néo-Zélandaise",
      nameEn: "New Zealander",
      flag: "🇳🇿",
    },
    { code: "NL", nameFr: "Néerlandaise", nameEn: "Dutch", flag: "🇳🇱" },
    { code: "SE", nameFr: "Suédoise", nameEn: "Swedish", flag: "🇸🇪" },
    { code: "NO", nameFr: "Norvégienne", nameEn: "Norwegian", flag: "🇳🇴" },
    { code: "DK", nameFr: "Danoise", nameEn: "Danish", flag: "🇩🇰" },
    { code: "FI", nameFr: "Finlandaise", nameEn: "Finnish", flag: "🇫🇮" },
    { code: "PL", nameFr: "Polonaise", nameEn: "Polish", flag: "🇵🇱" },
    { code: "GR", nameFr: "Grecque", nameEn: "Greek", flag: "🇬🇷" },
    { code: "IE", nameFr: "Irlandaise", nameEn: "Irish", flag: "🇮🇪" },
    { code: "AT", nameFr: "Autrichienne", nameEn: "Austrian", flag: "🇦🇹" },
    { code: "CZ", nameFr: "Tchèque", nameEn: "Czech", flag: "🇨🇿" },
    { code: "HU", nameFr: "Hongroise", nameEn: "Hungarian", flag: "🇭🇺" },
    { code: "RO", nameFr: "Roumaine", nameEn: "Romanian", flag: "🇷🇴" },
    { code: "HR", nameFr: "Croate", nameEn: "Croatian", flag: "🇭🇷" },
    { code: "KR", nameFr: "Sud-Coréenne", nameEn: "South Korean", flag: "🇰🇷" },
    { code: "TH", nameFr: "Thaïlandaise", nameEn: "Thai", flag: "🇹🇭" },
    { code: "VN", nameFr: "Vietnamienne", nameEn: "Vietnamese", flag: "🇻🇳" },
    { code: "ID", nameFr: "Indonésienne", nameEn: "Indonesian", flag: "🇮🇩" },
    { code: "PH", nameFr: "Philippine", nameEn: "Filipino", flag: "🇵🇭" },
    { code: "SG", nameFr: "Singapourienne", nameEn: "Singaporean", flag: "🇸🇬" },
    { code: "AE", nameFr: "Émirienne", nameEn: "Emirati", flag: "🇦🇪" },
    { code: "SA", nameFr: "Saoudienne", nameEn: "Saudi", flag: "🇸🇦" },
  ];

  for (const nat of nationalitiesData) {
    await prisma.nationality.upsert({
      where: { code: nat.code },
      update: nat,
      create: nat,
    });
  }

  console.log("✅ Nationalities seeded");

  // ============================================
  // 4. VILLES PRÉDÉFINIES (Top villes françaises + internationales)
  // ============================================
  console.log("🏙️ Seeding Cities...");

  const citiesData = [
    // France
    {
      name: "Paris",
      countryCode: "FR",
      countryName: "France",
      displayName: "Paris, France",
    },
    {
      name: "Marseille",
      countryCode: "FR",
      countryName: "France",
      displayName: "Marseille, France",
    },
    {
      name: "Lyon",
      countryCode: "FR",
      countryName: "France",
      displayName: "Lyon, France",
    },
    {
      name: "Toulouse",
      countryCode: "FR",
      countryName: "France",
      displayName: "Toulouse, France",
    },
    {
      name: "Nice",
      countryCode: "FR",
      countryName: "France",
      displayName: "Nice, France",
    },
    {
      name: "Nantes",
      countryCode: "FR",
      countryName: "France",
      displayName: "Nantes, France",
    },
    {
      name: "Strasbourg",
      countryCode: "FR",
      countryName: "France",
      displayName: "Strasbourg, France",
    },
    {
      name: "Montpellier",
      countryCode: "FR",
      countryName: "France",
      displayName: "Montpellier, France",
    },
    {
      name: "Bordeaux",
      countryCode: "FR",
      countryName: "France",
      displayName: "Bordeaux, France",
    },
    {
      name: "Lille",
      countryCode: "FR",
      countryName: "France",
      displayName: "Lille, France",
    },
    {
      name: "Rennes",
      countryCode: "FR",
      countryName: "France",
      displayName: "Rennes, France",
    },
    {
      name: "Reims",
      countryCode: "FR",
      countryName: "France",
      displayName: "Reims, France",
    },
    {
      name: "Le Havre",
      countryCode: "FR",
      countryName: "France",
      displayName: "Le Havre, France",
    },
    {
      name: "Saint-Étienne",
      countryCode: "FR",
      countryName: "France",
      displayName: "Saint-Étienne, France",
    },
    {
      name: "Toulon",
      countryCode: "FR",
      countryName: "France",
      displayName: "Toulon, France",
    },

    // Belgique
    {
      name: "Bruxelles",
      countryCode: "BE",
      countryName: "Belgique",
      displayName: "Bruxelles, Belgique",
    },
    {
      name: "Anvers",
      countryCode: "BE",
      countryName: "Belgique",
      displayName: "Anvers, Belgique",
    },
    {
      name: "Gand",
      countryCode: "BE",
      countryName: "Belgique",
      displayName: "Gand, Belgique",
    },
    {
      name: "Liège",
      countryCode: "BE",
      countryName: "Belgique",
      displayName: "Liège, Belgique",
    },

    // Suisse
    {
      name: "Genève",
      countryCode: "CH",
      countryName: "Suisse",
      displayName: "Genève, Suisse",
    },
    {
      name: "Zurich",
      countryCode: "CH",
      countryName: "Suisse",
      displayName: "Zurich, Suisse",
    },
    {
      name: "Lausanne",
      countryCode: "CH",
      countryName: "Suisse",
      displayName: "Lausanne, Suisse",
    },
    {
      name: "Berne",
      countryCode: "CH",
      countryName: "Suisse",
      displayName: "Berne, Suisse",
    },

    // Canada
    {
      name: "Montréal",
      countryCode: "CA",
      countryName: "Canada",
      displayName: "Montréal, Canada",
    },
    {
      name: "Québec",
      countryCode: "CA",
      countryName: "Canada",
      displayName: "Québec, Canada",
    },
    {
      name: "Toronto",
      countryCode: "CA",
      countryName: "Canada",
      displayName: "Toronto, Canada",
    },
    {
      name: "Vancouver",
      countryCode: "CA",
      countryName: "Canada",
      displayName: "Vancouver, Canada",
    },

    // Afrique francophone
    {
      name: "Abidjan",
      countryCode: "CI",
      countryName: "Côte d'Ivoire",
      displayName: "Abidjan, Côte d'Ivoire",
    },
    {
      name: "Dakar",
      countryCode: "SN",
      countryName: "Sénégal",
      displayName: "Dakar, Sénégal",
    },
    {
      name: "Cotonou",
      countryCode: "BJ",
      countryName: "Bénin",
      displayName: "Cotonou, Bénin",
    },
    {
      name: "Douala",
      countryCode: "CM",
      countryName: "Cameroun",
      displayName: "Douala, Cameroun",
    },
    {
      name: "Yaoundé",
      countryCode: "CM",
      countryName: "Cameroun",
      displayName: "Yaoundé, Cameroun",
    },
    {
      name: "Casablanca",
      countryCode: "MA",
      countryName: "Maroc",
      displayName: "Casablanca, Maroc",
    },
    {
      name: "Rabat",
      countryCode: "MA",
      countryName: "Maroc",
      displayName: "Rabat, Maroc",
    },
    {
      name: "Alger",
      countryCode: "DZ",
      countryName: "Algérie",
      displayName: "Alger, Algérie",
    },
    {
      name: "Tunis",
      countryCode: "TN",
      countryName: "Tunisie",
      displayName: "Tunis, Tunisie",
    },

    // International
    {
      name: "Londres",
      countryCode: "GB",
      countryName: "Royaume-Uni",
      displayName: "Londres, Royaume-Uni",
    },
    {
      name: "New York",
      countryCode: "US",
      countryName: "États-Unis",
      displayName: "New York, États-Unis",
    },
    {
      name: "Los Angeles",
      countryCode: "US",
      countryName: "États-Unis",
      displayName: "Los Angeles, États-Unis",
    },
    {
      name: "Berlin",
      countryCode: "DE",
      countryName: "Allemagne",
      displayName: "Berlin, Allemagne",
    },
    {
      name: "Madrid",
      countryCode: "ES",
      countryName: "Espagne",
      displayName: "Madrid, Espagne",
    },
    {
      name: "Barcelone",
      countryCode: "ES",
      countryName: "Espagne",
      displayName: "Barcelone, Espagne",
    },
    {
      name: "Rome",
      countryCode: "IT",
      countryName: "Italie",
      displayName: "Rome, Italie",
    },
    {
      name: "Milan",
      countryCode: "IT",
      countryName: "Italie",
      displayName: "Milan, Italie",
    },
    {
      name: "Amsterdam",
      countryCode: "NL",
      countryName: "Pays-Bas",
      displayName: "Amsterdam, Pays-Bas",
    },
    {
      name: "Lisbonne",
      countryCode: "PT",
      countryName: "Portugal",
      displayName: "Lisbonne, Portugal",
    },
  ];

  for (const city of citiesData) {
    await prisma.city.upsert({
      where: {
        name_countryCode: {
          name: city.name,
          countryCode: city.countryCode,
        },
      },
      update: city,
      create: city,
    });
  }

  console.log("✅ Cities seeded");

  // ============================================
  // 5. CHAT DATA
  // ============================================
  await seedChatData();

  console.log("🎉 Seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
