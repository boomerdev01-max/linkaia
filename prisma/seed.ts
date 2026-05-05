import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// ✨ Import de country-state-city
import { Country, State, City as CscCity } from "country-state-city";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

// ============================================
// 🌍 STRATÉGIE DE SEED OPTIMISÉE POUR PAYS & VILLES
// ============================================
/**
 * On seed uniquement :
 * 1. Pays francophones (Afrique + Europe)
 * 2. Grandes villes internationales (population estimée)
 * 3. Villes africaines importantes
 *
 * Estimation : ~200 pays + ~500-1000 villes / Léger pour Supabase Free
 */

// Liste des pays francophones prioritaires (codes ISO)
const PRIORITY_COUNTRIES = [
  // Afrique francophone
  "BJ",
  "BF",
  "BI",
  "CM",
  "CF",
  "TD",
  "KM",
  "CG",
  "CD",
  "CI",
  "DJ",
  "GQ",
  "GA",
  "GN",
  "ML",
  "NE",
  "RW",
  "SN",
  "SC",
  "TG",
  // Europe francophone
  "FR",
  "BE",
  "CH",
  "LU",
  "MC",
  // Canada
  "CA",
  // Maghreb
  "MA",
  "DZ",
  "TN",
  // Autres pays importants
  "US",
  "GB",
  "DE",
  "ES",
  "IT",
  "PT",
  "NL",
];

// Villes africaines majeures à inclure (par pays)
const AFRICAN_MAJOR_CITIES: Record<string, string[]> = {
  BJ: ["Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi"],
  BF: ["Ouagadougou", "Bobo-Dioulasso"],
  CI: ["Abidjan", "Yamoussoukro", "Bouaké", "Daloa"],
  SN: ["Dakar", "Touba", "Thiès", "Saint-Louis"],
  CM: ["Douala", "Yaoundé", "Garoua", "Bafoussam"],
  TG: ["Lomé", "Sokodé", "Kara"],
  ML: ["Bamako", "Sikasso", "Mopti"],
  NE: ["Niamey", "Zinder", "Maradi"],
  GA: ["Libreville", "Port-Gentil"],
  CG: ["Brazzaville", "Pointe-Noire"],
  CD: ["Kinshasa", "Lubumbashi", "Mbuji-Mayi"],
  MA: ["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger"],
  DZ: ["Alger", "Oran", "Constantine"],
  TN: ["Tunis", "Sfax", "Sousse"],
};

// Villes internationales majeures (pour non-africains)
const INTERNATIONAL_MAJOR_CITIES = [
  // France
  "Paris",
  "Marseille",
  "Lyon",
  "Toulouse",
  "Nice",
  "Nantes",
  "Strasbourg",
  "Montpellier",
  "Bordeaux",
  "Lille",
  // USA
  "New York",
  "Los Angeles",
  "Chicago",
  "Houston",
  "Miami",
  // UK
  "London",
  "Manchester",
  "Birmingham",
  // Canada
  "Toronto",
  "Montreal",
  "Vancouver",
  "Quebec City",
  // Europe
  "Berlin",
  "Madrid",
  "Barcelona",
  "Rome",
  "Milan",
  "Amsterdam",
  "Lisbon",
  "Brussels",
  "Geneva",
  "Zurich",
];

async function seedNationalities() {
  console.log("🌍 Seeding Nationalities from country-state-city...");

  const countries = Country.getAllCountries();
  let seededCount = 0;

  for (const country of countries) {
    // Seeder TOUS les pays (pour avoir la liste complète dans les filtres)
    await prisma.nationality.upsert({
      where: { code: country.isoCode },
      update: {
        nameFr: country.name, // country-state-city a des noms en anglais, on garde tel quel
        nameEn: country.name,
        flag: country.flag,
      },
      create: {
        code: country.isoCode,
        nameFr: country.name,
        nameEn: country.name,
        flag: country.flag,
      },
    });

    seededCount++;
  }

  console.log(`✅ ${seededCount} nationalities seeded`);
}

async function seedCities() {
  console.log("🏙️ Seeding Cities from country-state-city...");

  let seededCount = 0;

  // 1. Seeder les villes des pays prioritaires
  for (const countryCode of PRIORITY_COUNTRIES) {
    const country = Country.getCountryByCode(countryCode);
    if (!country) continue;

    const states = State.getStatesOfCountry(countryCode);

    for (const state of states) {
      const cities = CscCity.getCitiesOfState(countryCode, state.isoCode);

      for (const city of cities) {
        // Filtrage intelligent :
        // - Villes africaines : on prend celles de la liste AFRICAN_MAJOR_CITIES
        // - Villes internationales : on prend celles de INTERNATIONAL_MAJOR_CITIES
        // - Villes françaises : on prend toutes celles avec population > 50k (approximation)

        const isAfricanMajorCity = AFRICAN_MAJOR_CITIES[countryCode]?.includes(
          city.name,
        );
        const isInternationalMajorCity = INTERNATIONAL_MAJOR_CITIES.includes(
          city.name,
        );

        // Heuristique simple : si le nom de la ville est court et connu, on la garde
        const isFrenchCity = countryCode === "FR" && city.name.length > 3;

        if (
          isAfricanMajorCity ||
          isInternationalMajorCity ||
          (isFrenchCity && seededCount < 1000) // Limiter à 1000 villes max
        ) {
          const displayName = `${city.name}, ${state.name}, ${country.name}`;

          await prisma.city.upsert({
            where: {
              name_stateCode_countryCode: {
                name: city.name,
                stateCode: state.isoCode,
                countryCode: countryCode,
              },
            },
            update: {
              stateName: state.name,
              countryName: country.name,
              displayName: displayName,
              latitude: city.latitude ? parseFloat(city.latitude) : null,
              longitude: city.longitude ? parseFloat(city.longitude) : null,
            },
            create: {
              name: city.name,
              stateCode: state.isoCode,
              stateName: state.name,
              countryCode: countryCode,
              countryName: country.name,
              displayName: displayName,
              latitude: city.latitude ? parseFloat(city.latitude) : null,
              longitude: city.longitude ? parseFloat(city.longitude) : null,
            },
          });

          seededCount++;

          // Limite de sécurité pour ne pas exploser la DB
          if (seededCount >= 1500) {
            console.log(
              `⚠️ Limite de 1500 villes atteinte, arrêt du seed cities`,
            );
            break;
          }
        }
      }

      if (seededCount >= 1500) break;
    }

    if (seededCount >= 1500) break;
  }

  console.log(`✅ ${seededCount} cities seeded`);
}

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
    { name: "user.read", description: "Consulter les utilisateurs" },
    { name: "user.create", description: "Créer des utilisateurs" },
    { name: "user.update", description: "Modifier les utilisateurs" },
    { name: "user.delete", description: "Supprimer les utilisateurs" },
    { name: "user.list", description: "Lister les utilisateurs" },
    { name: "user.profile", description: "Consulter les profils détaillés" },
    { name: "role.read", description: "Consulter les rôles" },
    { name: "role.create", description: "Créer des rôles" },
    { name: "role.update", description: "Modifier les rôles" },
    { name: "role.delete", description: "Supprimer les rôles" },
    { name: "permission.manage", description: "Gérer les permissions" },
    { name: "post.read", description: "Consulter les posts" },
    { name: "post.moderate", description: "Modérer les posts" },
    { name: "post.delete", description: "Supprimer les posts" },
    { name: "comment.moderate", description: "Modérer les commentaires" },
    { name: "media.moderate", description: "Modérer les médias" },
    { name: "transaction.read", description: "Consulter les transactions" },
    { name: "transaction.create", description: "Créer des transactions" },
    { name: "invoice.read", description: "Consulter les factures" },
    { name: "invoice.create", description: "Créer des factures" },
    { name: "invoice.update", description: "Modifier les factures" },
    {
      name: "statistics.view",
      description: "Consulter les statistiques financières",
    },
    { name: "notification.send", description: "Envoyer des notifications" },
    {
      name: "notifications.view",
      description: "Voir les notifications admin",
    },
    { name: "email.send", description: "Envoyer des emails" },
    { name: "system.config", description: "Configurer le système" },
    { name: "system.logs", description: "Consulter les logs" },
    { name: "prestige.manage", description: "Gérer les codes prestige" },
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
  // 3. ACTIONS
  // ============================================
  console.log("⚡ Creating Actions...");

  const actionsData = [
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
    {
      method: "GET",
      endpoint: "/api/admin/dashboard",
      description: "Dashboard data",
    },
    {
      method: "GET",
      endpoint: "/api/admin/prestige-codes",
      description: "Liste des codes prestige",
    },
    {
      method: "POST",
      endpoint: "/api/admin/prestige-codes",
      description: "Générer un code prestige",
    },
    {
      method: "DELETE",
      endpoint: "/api/admin/prestige-codes",
      description: "Révoquer un code prestige",
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
  // 4. MENUS
  // ============================================
  console.log("📋 Creating Menus...");

  const menuUsers = await prisma.menu.upsert({
    where: { name: "Utilisateurs" },
    update: { path: null, icon: "Users", order: 1 },
    create: { name: "Utilisateurs", path: null, icon: "Users", order: 1 },
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
    where: { name: "Paiements" },
    update: { path: null, icon: "CreditCard", order: 3 },
    create: {
      name: "Paiements",
      path: null,
      icon: "CreditCard",
      order: 3,
    },
  });

  const menuStats = await prisma.menu.upsert({
    where: { name: "Statistiques" },
    update: { path: null, icon: "BarChart3", order: 4 },
    create: {
      name: "Statistiques",
      path: null,
      icon: "BarChart3",
      order: 4,
    },
  });

  const menuComm = await prisma.menu.upsert({
    where: { name: "Communication" },
    update: { path: null, icon: "Bell", order: 5 },
    create: { name: "Communication", path: null, icon: "Bell", order: 5 },
  });

  const menuConfig = await prisma.menu.upsert({
    where: { name: "Paramètres" },
    update: { path: null, icon: "Settings", order: 6 },
    create: {
      name: "Paramètres",
      path: null,
      icon: "Settings",
      order: 6,
    },
  });

  const menuFinance = await prisma.menu.upsert({
    where: { name: "Finances" },
    update: { path: null, icon: "Wallet", order: 7 },
    create: { name: "Finances", path: null, icon: "Wallet", order: 7 },
  });

  await prisma.menu.upsert({
    where: { name: "Profils utilisateurs" },
    update: {
      path: "/admin/users/profiles",
      icon: "UserCheck",
      parentId: menuUsers.id,
      order: 1,
    },
    create: {
      name: "Profils utilisateurs",
      path: "/admin/users/profiles",
      icon: "UserCheck",
      parentId: menuUsers.id,
      order: 1,
    },
  });

  await prisma.menu.upsert({
    where: { name: "Rôles et permissions" },
    update: {
      path: "/admin/users/roles",
      icon: "Shield",
      parentId: menuUsers.id,
      order: 2,
    },
    create: {
      name: "Rôles et permissions",
      path: "/admin/users/roles",
      icon: "Shield",
      parentId: menuUsers.id,
      order: 2,
    },
  });

  await prisma.menu.upsert({
    where: { name: "Codes prestige" },
    update: {
      path: "/admin/prestige-codes",
      icon: "Crown",
      parentId: menuUsers.id,
      order: 3,
    },
    create: {
      name: "Codes prestige",
      path: "/admin/prestige-codes",
      icon: "Crown",
      parentId: menuUsers.id,
      order: 3,
    },
  });

  await prisma.menu.upsert({
    where: { name: "Médias en attente" },
    update: {
      path: "/admin/content/pending-media",
      icon: "FileImage",
      parentId: menuContent.id,
      order: 1,
    },
    create: {
      name: "Médias en attente",
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
    where: { name: "Statistiques" },
    update: {
      path: "/admin/services/statistics",
      icon: "TrendingUp",
      parentId: menuServices.id,
      order: 2,
    },
    create: {
      name: "Statistiques",
      path: "/admin/services/statistics",
      icon: "TrendingUp",
      parentId: menuServices.id,
      order: 2,
    },
  });

  await prisma.menu.upsert({
    where: { name: "Revenus" },
    update: {
      path: "/admin/stats/reports",
      icon: "TrendingUp",
      parentId: menuStats.id,
      order: 1,
    },
    create: {
      name: "Revenus",
      path: "/admin/stats/reports",
      icon: "TrendingUp",
      parentId: menuStats.id,
      order: 1,
    },
  });

  await prisma.menu.upsert({
    where: { name: "Notifications" },
    update: {
      path: "/admin/communication/notifications",
      icon: "Mail",
      parentId: menuComm.id,
      order: 1,
    },
    create: {
      name: "Notifications",
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
    where: { name: "Demandes et factures" },
    update: {
      path: "/admin/finance/invoices",
      icon: "Receipt",
      parentId: menuFinance.id,
      order: 1,
    },
    create: {
      name: "Demandes et factures",
      path: "/admin/finance/invoices",
      icon: "Receipt",
      parentId: menuFinance.id,
      order: 1,
    },
  });

  console.log("✅ Menus created");

  // ============================================
  // 5. ROLE-PERMISSIONS
  // ============================================
  console.log("🔗 Creating Role-Permission associations...");

  for (const permKey of Object.keys(permissions)) {
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

  const moderatorPerms = [
    "dashboard.view",
    "post.read",
    "post.moderate",
    "post.delete",
    "comment.moderate",
    "media.moderate",
    "user.read",
    "user.list",
    "notifications.view",
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
  // 6. PERMISSION-ACTIONS
  // ============================================
  console.log("🔗 Creating Permission-Action associations...");

  const permActionMap: Record<string, string[]> = {
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
    "prestige.manage": [
      "GET:/api/admin/prestige-codes",
      "POST:/api/admin/prestige-codes",
      "DELETE:/api/admin/prestige-codes",
    ],
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
  // 7. MENU-PERMISSIONS
  // ============================================
  console.log("🔗 Creating Menu-Permission associations...");

  const allMenus = await prisma.menu.findMany();
  const menuPermMap: Record<string, string[]> = {
    Utilisateurs: ["user.read", "user.list"],
    "Profils utilisateurs": ["user.read", "user.profile"],
    "Rôles et permissions": ["role.read", "permission.manage"],
    "Codes prestige": ["prestige.manage"],
    "Gestion de contenu": ["post.read", "media.moderate"],
    "Médias en attente": ["media.moderate"],
    Paiements: ["transaction.read"],
    Transactions: ["transaction.read", "transaction.create"],
    Statistiques: ["statistics.view"],
    Rapports: ["reports.view"],
    Revenus: ["reports.view", "reports.export"],
    Communication: ["notification.send", "email.send"],
    Notifications: ["notification.send", "email.send"],
    Paramètres: ["system.config"],
    Administration: ["system.config", "system.logs"],
    Finances: ["invoice.read"],
    "Demandes et factures": [
      "invoice.read",
      "invoice.create",
      "invoice.update",
    ],
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
          create: { menuId: menu.id, permissionId: permissions[permKey].id },
        });
      }
    }
  }

  console.log("✅ Menu-Permission associations created");

  // ============================================
  // 8. ADMIN PAR DÉFAUT
  // ============================================
  console.log("👤 Creating default admin user...");

  const adminEmail = "admin@linkaia.com";
  const adminPassword = "Admin@123";

  const { createSupabaseAuthUser, getSupabaseUserByEmail } =
    await import("@/lib/supabase/admin-client");

  // ✅ Client admin Supabase pour écrire l'app_metadata
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    console.log("📝 Creating admin in Supabase Auth...");

    try {
      const supabaseUser = await createSupabaseAuthUser(
        adminEmail,
        adminPassword,
        { nom: "Admin", prenom: "System" },
        true,
      );

      // ✅ Écrire le rôle dans app_metadata pour que proxy.ts puisse le lire
      //    sans appel DB (Edge Runtime compatible)
      await supabaseAdmin.auth.admin.updateUserById(supabaseUser.id, {
        app_metadata: { primary_role: "administrator" },
      });

      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      adminUser = await prisma.user.create({
        data: {
          nom: "Admin",
          prenom: "System",
          email: adminEmail,
          password: hashedPassword,
          supabaseId: supabaseUser.id,
          provider: "email",
          emailVerified: true,
          adminCreated: true,
          isFirstLogin: true,
          mustChangePassword: false,
          level: "FREE",
        },
      });

      console.log(`✅ Admin created with supabaseId: ${supabaseUser.id}`);
    } catch (error: any) {
      if (error?.message?.includes("User already registered")) {
        console.log("⚠️ Admin email already exists in Supabase Auth");
        throw error;
      } else {
        throw error;
      }
    }
  } else {
    console.log("ℹ️ Admin user already exists in Prisma");

    if (!adminUser.supabaseId) {
      console.log(
        "⚠️ Admin exists but has no supabaseId. Attempting to fix...",
      );

      try {
        const existingSupabaseUser = await getSupabaseUserByEmail(adminEmail);

        if (existingSupabaseUser) {
          console.log(
            `📎 Linking existing Supabase user: ${existingSupabaseUser.id}`,
          );

          // ✅ Écrire app_metadata même pour un user Supabase existant
          await supabaseAdmin.auth.admin.updateUserById(
            existingSupabaseUser.id,
            {
              app_metadata: { primary_role: "administrator" },
            },
          );

          adminUser = await prisma.user.update({
            where: { email: adminEmail },
            data: { supabaseId: existingSupabaseUser.id, emailVerified: true },
          });

          console.log(
            `✅ Admin linked with supabaseId: ${existingSupabaseUser.id}`,
          );
        } else {
          console.log("📝 Creating admin in Supabase Auth...");

          const supabaseUser = await createSupabaseAuthUser(
            adminEmail,
            adminPassword,
            { nom: adminUser.nom, prenom: adminUser.prenom },
            true,
          );

          await supabaseAdmin.auth.admin.updateUserById(supabaseUser.id, {
            app_metadata: { primary_role: "administrator" },
          });

          adminUser = await prisma.user.update({
            where: { email: adminEmail },
            data: { supabaseId: supabaseUser.id, emailVerified: true },
          });

          console.log(`✅ Admin fixed with new supabaseId: ${supabaseUser.id}`);
        }
      } catch (error) {
        console.error("❌ Failed to fix admin sync:", error);
        throw error;
      }
    } else {
      // ✅ L'admin existe déjà avec un supabaseId — s'assurer que app_metadata est à jour
      console.log(`✅ Admin already has supabaseId: ${adminUser.supabaseId}`);
      console.log("🔄 Syncing app_metadata...");

      await supabaseAdmin.auth.admin.updateUserById(adminUser.supabaseId, {
        app_metadata: { primary_role: "administrator" },
      });

      console.log("✅ app_metadata synced");
    }
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: adminUser.id, roleId: roles.administrator.id },
    },
    update: {},
    create: { userId: adminUser.id, roleId: roles.administrator.id },
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

async function seedInterests() {
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
}

async function seedReactions() {
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
}

export async function seedWalletData(prisma: any) {
  console.log("💎 Seeding Wallet Data...");

  // ── 1. Causes ONG ──────────────────────────────────────────────────────────
  const causeEducation = await prisma.impactCause.upsert({
    where: { id: "cause-education-001" },
    update: {},
    create: {
      id: "cause-education-001",
      name: "Éducation en Afrique",
      description:
        "Financement de fournitures scolaires pour des enfants en zones rurales",
      isActive: true,
    },
  });

  const causeEau = await prisma.impactCause.upsert({
    where: { id: "cause-eau-001" },
    update: {},
    create: {
      id: "cause-eau-001",
      name: "Accès à l'eau potable",
      description: "Construction de puits et systèmes de purification",
      isActive: true,
    },
  });

  console.log("✅ Impact Causes seeded");

  // ── 2. Cadeaux Virtuels ────────────────────────────────────────────────────
  const gifts = [
    // Standard
    {
      code: "pont",
      name: "Le Pont",
      emoji: "🌉",
      description: "Symbole de connexion entre deux cultures",
      lgemsValue: 5,
      isImpactGift: false,
      category: "standard",
      order: 1,
    },
    {
      code: "boussole",
      name: "La Boussole",
      emoji: "🧭",
      description: "Guide vers de belles rencontres",
      lgemsValue: 10,
      isImpactGift: false,
      category: "standard",
      order: 2,
    },
    {
      code: "globe",
      name: "Le Globe",
      emoji: "🌍",
      description: "L'amour n'a pas de frontières",
      lgemsValue: 25,
      isImpactGift: false,
      category: "standard",
      order: 3,
    },
    {
      code: "alliance",
      name: "L'Alliance",
      emoji: "💍",
      description: "Un gage d'amour et d'engagement",
      lgemsValue: 50,
      isImpactGift: false,
      category: "premium",
      order: 1,
    },
    {
      code: "etoile_filante",
      name: "Étoile Filante",
      emoji: "🌠",
      description: "Un vœu pour votre avenir",
      lgemsValue: 100,
      isImpactGift: false,
      category: "premium",
      order: 2,
    },
    // Impact
    {
      code: "puits_savoir",
      name: "Puits de Savoir",
      emoji: "📚",
      description: "5% reversé à l'éducation en Afrique",
      lgemsValue: 20,
      isImpactGift: true,
      impactPercent: 0.05,
      impactCauseId: causeEducation.id,
      category: "impact",
      order: 1,
    },
    {
      code: "goutte_eau",
      name: "Goutte d'Eau",
      emoji: "💧",
      description: "5% reversé pour l'accès à l'eau potable",
      lgemsValue: 20,
      isImpactGift: true,
      impactPercent: 0.05,
      impactCauseId: causeEau.id,
      category: "impact",
      order: 2,
    },
  ];

  for (const gift of gifts) {
    await prisma.virtualGift.upsert({
      where: { code: gift.code },
      update: gift,
      create: { ...gift, isActive: true },
    });
  }

  console.log(`✅ ${gifts.length} virtual gifts seeded`);

  // ── 3. Packs L-Gems ────────────────────────────────────────────────────────
  // NOTE : les stripePriceId seront renseignés via .env après création dans Stripe
  const packs = [
    {
      code: "starter_100",
      name: "Starter",
      description: "Parfait pour débuter",
      lgemsAmount: 100,
      bonusLgems: 0,
      priceEur: 0.99,
      priceXof: 650,
      isFeatured: false,
      order: 1,
    },
    {
      code: "popular_500",
      name: "Populaire",
      description: "+50 L-Gems offerts",
      lgemsAmount: 500,
      bonusLgems: 50,
      priceEur: 4.99,
      priceXof: 3250,
      isFeatured: true,
      order: 2,
    },
    {
      code: "pro_1000",
      name: "Pro",
      description: "+150 L-Gems offerts",
      lgemsAmount: 1000,
      bonusLgems: 150,
      priceEur: 9.99,
      priceXof: 6500,
      isFeatured: false,
      order: 3,
    },
    {
      code: "elite_5000",
      name: "Élite",
      description: "+1000 L-Gems offerts",
      lgemsAmount: 5000,
      bonusLgems: 1000,
      priceEur: 44.99,
      priceXof: 29250,
      isFeatured: false,
      order: 4,
    },
  ];

  for (const pack of packs) {
    await prisma.lGemsPack.upsert({
      where: { code: pack.code },
      update: pack,
      create: { ...pack, isActive: true },
    });
  }

  console.log(`✅ ${packs.length} L-Gems packs seeded`);

  // ── 4. Badges Gamification ─────────────────────────────────────────────────
  const badges = [
    {
      code: "philanthrope",
      name: "Philanthrope",
      emoji: "🤝",
      description: "Donateur régulier de cadeaux virtuels",
      level: 1,
      criteriaDescription: "Avoir envoyé au moins 10 cadeaux virtuels",
    },
    {
      code: "pont_des_cultures",
      name: "Pont des Cultures",
      emoji: "🌉",
      description: "Créateur ayant connecté plusieurs pays",
      level: 2,
      criteriaDescription: "Avoir une audience dans au moins 5 pays différents",
    },
    {
      code: "legende_linkaia",
      name: "Légende Linkaïa",
      emoji: "👑",
      description: "Célébrité ayant parrainé une entreprise sociale réelle",
      level: 3,
      criteriaDescription: "Avoir parrainé une organisation sociale partenaire",
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: badge,
      create: badge,
    });
  }

  console.log(`✅ ${badges.length} badges seeded`);
  console.log("🎉 Wallet data seeding complete!");
}

// Post Categories Seeding

const postCategories = [
  { code: "culture", label: "Culture & Arts", emoji: "🎭", order: 1 },
  { code: "voyage", label: "Voyage & Découvertes", emoji: "✈️", order: 2 },
  { code: "lifestyle", label: "Lifestyle", emoji: "✨", order: 3 },
  {
    code: "famille_valeurs",
    label: "Famille & Valeurs",
    emoji: "👨‍👩‍👧",
    order: 4,
  },
  {
    code: "spiritualite",
    label: "Spiritualité & Foi",
    emoji: "🙏",
    order: 5,
  },
  { code: "cuisine", label: "Cuisine & Gastronomie", emoji: "🍽️", order: 6 },
  { code: "mode_beaute", label: "Mode & Beauté", emoji: "💄", order: 7 },
  { code: "humour", label: "Humour & Bonne humeur", emoji: "😄", order: 8 },
  { code: "actualite", label: "Actualité", emoji: "📰", order: 9 },
  {
    code: "sport_bienetre",
    label: "Sport & Bien-être",
    emoji: "💪",
    order: 10,
  },
];

async function seedPostCategories() {
  for (const cat of postCategories) {
    await prisma.postCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }
  console.log("✅ Post categories seeded");
}

async function seedReferenceData() {
  console.log("📚 Seeding Reference Data for Preferences...");

  // ============================================
  // 1. RELIGIONS
  // ============================================
  const religions = [
    { code: "christian", label: "Chrétien", emoji: "✝️", order: 1 },
    { code: "muslim", label: "Musulman", emoji: "☪️", order: 2 },
    { code: "jewish", label: "Juif", emoji: "✡️", order: 3 },
    { code: "hindu", label: "Hindou", emoji: "🕉️", order: 4 },
    { code: "buddhist", label: "Bouddhiste", emoji: "☸️", order: 5 },
    { code: "atheist", label: "Athée", emoji: "🚫", order: 6 },
    { code: "agnostic", label: "Agnostique", emoji: "❓", order: 7 },
    { code: "spiritual", label: "Spirituel", emoji: "🌟", order: 8 },
    { code: "other", label: "Autre", emoji: "➕", order: 9 },
  ];

  for (const religion of religions) {
    await prisma.religion.upsert({
      where: { code: religion.code },
      update: religion,
      create: religion,
    });
  }
  console.log(`✅ ${religions.length} religions seeded`);

  // ============================================
  // 2. SIGNES ASTROLOGIQUES
  // ============================================
  const zodiacSigns = [
    { code: "aries", label: "Bélier", emoji: "♈", order: 1 },
    { code: "taurus", label: "Taureau", emoji: "♉", order: 2 },
    { code: "gemini", label: "Gémeaux", emoji: "♊", order: 3 },
    { code: "cancer", label: "Cancer", emoji: "♋", order: 4 },
    { code: "leo", label: "Lion", emoji: "♌", order: 5 },
    { code: "virgo", label: "Vierge", emoji: "♍", order: 6 },
    { code: "libra", label: "Balance", emoji: "♎", order: 7 },
    { code: "scorpio", label: "Scorpion", emoji: "♏", order: 8 },
    { code: "sagittarius", label: "Sagittaire", emoji: "♐", order: 9 },
    { code: "capricorn", label: "Capricorne", emoji: "♑", order: 10 },
    { code: "aquarius", label: "Verseau", emoji: "♒", order: 11 },
    { code: "pisces", label: "Poissons", emoji: "♓", order: 12 },
  ];

  for (const sign of zodiacSigns) {
    await prisma.zodiacSign.upsert({
      where: { code: sign.code },
      update: sign,
      create: sign,
    });
  }
  console.log(`✅ ${zodiacSigns.length} zodiac signs seeded`);

  // ============================================
  // 3. ORIENTATIONS SEXUELLES
  // ============================================
  const orientations = [
    { code: "hetero", label: "Hétérosexuel", emoji: "❤️", order: 1 },
    { code: "homo", label: "Homosexuel", emoji: "🏳️‍🌈", order: 2 },
    { code: "bi", label: "Bisexuel", emoji: "💜", order: 3 },
    { code: "pan", label: "Pansexuel", emoji: "💗", order: 4 },
    { code: "asexual", label: "Asexuel", emoji: "🖤", order: 5 },
    { code: "questioning", label: "En questionnement", emoji: "❓", order: 6 },
    { code: "other", label: "Autre", emoji: "➕", order: 7 },
  ];

  for (const orientation of orientations) {
    await prisma.sexualOrientation.upsert({
      where: { code: orientation.code },
      update: orientation,
      create: orientation,
    });
  }
  console.log(`✅ ${orientations.length} sexual orientations seeded`);

  // ============================================
  // 4. STATUTS RELATIONNELS
  // ============================================
  const relationshipStatuses = [
    { code: "single", label: "Célibataire", emoji: "💔", order: 1 },
    { code: "couple", label: "En couple", emoji: "❤️", order: 2 },
    { code: "complicated", label: "C'est compliqué", emoji: "🤷", order: 3 },
    { code: "open", label: "Relation libre", emoji: "🔓", order: 4 },
    { code: "divorced", label: "Divorcé", emoji: "💍", order: 5 },
    { code: "widowed", label: "Veuf/Veuve", emoji: "🖤", order: 6 },
  ];

  for (const status of relationshipStatuses) {
    await prisma.relationshipStatus.upsert({
      where: { code: status.code },
      update: status,
      create: status,
    });
  }
  console.log(`✅ ${relationshipStatuses.length} relationship statuses seeded`);

  // ============================================
  // 5. TEINTS DE PEAU
  // ============================================
  const skinTones = [
    { code: "very-light", label: "Très clair", emoji: "🤍", order: 1 },
    { code: "light", label: "Clair", emoji: "🤎", order: 2 },
    { code: "medium", label: "Moyen", emoji: "🧡", order: 3 },
    { code: "tanned", label: "Bronzé", emoji: "🟤", order: 4 },
    { code: "brown", label: "Brun", emoji: "🟫", order: 5 },
    { code: "dark", label: "Foncé", emoji: "🖤", order: 6 },
  ];

  for (const tone of skinTones) {
    await prisma.skinTone.upsert({
      where: { code: tone.code },
      update: tone,
      create: tone,
    });
  }
  console.log(`✅ ${skinTones.length} skin tones seeded`);

  // ============================================
  // 6. TYPES DE PERSONNALITÉ
  // ============================================
  const personalityTypes = [
    { code: "introvert", label: "Introverti", emoji: "🤫", order: 1 },
    { code: "extrovert", label: "Extraverti", emoji: "🎉", order: 2 },
    { code: "ambivert", label: "Ambivert", emoji: "⚖️", order: 3 },
  ];

  for (const type of personalityTypes) {
    await prisma.personalityType.upsert({
      where: { code: type.code },
      update: type,
      create: type,
    });
  }
  console.log(`✅ ${personalityTypes.length} personality types seeded`);

  // ============================================
  // 7. NIVEAUX D'ÉDUCATION
  // ============================================
  const educationLevels = [
    { code: "primary", label: "Primaire", emoji: "📖", order: 1 },
    { code: "high-school", label: "Lycée", emoji: "🎓", order: 2 },
    { code: "bachelor", label: "Licence", emoji: "📚", order: 3 },
    { code: "master", label: "Master", emoji: "🏆", order: 4 },
    { code: "doctorate", label: "Doctorat", emoji: "🎖️", order: 5 },
    {
      code: "vocational",
      label: "Formation professionnelle",
      emoji: "🔧",
      order: 6,
    },
    { code: "other", label: "Autre", emoji: "➕", order: 7 },
  ];

  for (const level of educationLevels) {
    await prisma.educationLevel.upsert({
      where: { code: level.code },
      update: level,
      create: level,
    });
  }
  console.log(`✅ ${educationLevels.length} education levels seeded`);

  console.log("🎉 Reference data seeding complete!");
}

async function main() {
  console.log("🌱 Starting seed with country-state-city...");

  // ✨ L'ORDRE EST IMPORTANT
  await seedNationalities(); // 1️⃣ D'abord les pays
  await seedCities(); // 2️⃣ Puis les villes
  await seedReferenceData(); // ✅ NOUVEAU - Données de préférences
  await seedRBAC(); // 3️⃣ RBAC et admin
  await seedCompanyRoles(); // 4️⃣ Rôles entreprise
  await seedSubscriptions(); // 5️⃣ Abonnements
  await seedReportCategories(); // 6️⃣ Signalements
  await seedChatData(); // 7️⃣ Chat
  await seedInterests(); // 8️⃣ Centres d'intérêt
  await seedReactions(); // 9️⃣ Réactions
  await seedWalletData(prisma); // 10️⃣ Wallet & cadeaux
  await seedPostCategories(); // 11 Smart Feed

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
