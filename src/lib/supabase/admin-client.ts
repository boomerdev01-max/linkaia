// lib/supabase/admin-client.ts
import { createClient } from "@supabase/supabase-js";

/**
 * 🔐 Client Supabase Admin avec service_role key
 *
 * ⚠️ ATTENTION : À utiliser UNIQUEMENT côté serveur (API routes, server actions)
 * Cette clé bypass toutes les RLS policies !
 *
 * NE JAMAIS exposer cette clé côté client ou la commit dans Git
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const supabaseAdmin = getSupabaseAdmin();

/**
 * ✅ Crée un utilisateur dans Supabase Auth
 *
 * @param email - Email de l'utilisateur
 * @param password - Mot de passe en clair (sera hashé par Supabase)
 * @param metadata - Données additionnelles (nom, prénom, etc.)
 * @param emailConfirmed - Si true, l'email est déjà confirmé (bypass vérification Supabase)
 *
 * @returns L'utilisateur créé avec son ID Supabase
 */
export async function createSupabaseAuthUser(
  email: string,
  password: string,
  metadata?: { nom?: string; prenom?: string },
  emailConfirmed: boolean = false,
) {
  try {
    console.log(
      `🔄 Creating Supabase user for: ${email} (emailConfirmed: ${emailConfirmed})`,
    );

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: emailConfirmed, // Valide uniquement dans createUser
      user_metadata: metadata,
    });

    if (error) {
      console.error(
        "❌ Error creating Supabase auth user:",
        error.message,
        error,
      );
      throw error;
    }

    console.log(
      `✅ User created in Supabase Auth: ${data.user.id} | email_confirmed: ${!!data.user.email_confirmed_at}`,
    );
    return data.user;
  } catch (error) {
    console.error("❌ Failed to create Supabase user:", error);
    throw error;
  }
}

/**
 * ✅ Confirme l'email d'un utilisateur dans Supabase Auth
 *
 * ⚠️ IMPORTANT : Utilise `email_confirmed_at` (et NON `email_confirm`)
 * car `email_confirm` n'est valide que dans `createUser`, pas dans `updateUserById`.
 *
 * @param userId - L'ID Supabase de l'utilisateur
 */
export async function confirmUserEmail(userId: string) {
  try {
    console.log(`🔄 Confirming email for Supabase user: ${userId}`);

    // Vérifier l'état avant confirmation
    const { data: beforeData } =
      await supabaseAdmin.auth.admin.getUserById(userId);
    console.log(
      `📋 Before confirmation - email_confirmed_at: ${beforeData?.user?.email_confirmed_at ?? "null (non confirmé)"}`,
    );

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        // ✅ email_confirmed_at est la bonne propriété pour updateUserById
        // ⚠️ Le type AdminUserAttributes du SDK est incorrect et ne l'expose pas,
        // contrairement à email_confirm qui est réservé à createUser uniquement.
        email_confirmed_at: new Date().toISOString(),
      } as any,
    );

    if (error) {
      console.error(
        "❌ Error confirming email in Supabase:",
        error.message,
        error,
      );
      throw error;
    }

    console.log(
      `✅ Email confirmed in Supabase for user: ${userId} | email_confirmed_at: ${data.user.email_confirmed_at}`,
    );
    return data.user;
  } catch (error) {
    console.error("❌ Failed to confirm email in Supabase:", error);
    throw error;
  }
}

/**
 * 🔑 Génère un lien de connexion magique pour auto-login
 *
 * Utile pour connecter automatiquement l'utilisateur après vérification
 *
 * @param email - Email de l'utilisateur
 * @param redirectTo - URL de redirection après connexion
 */
export async function generateMagicLink(
  email: string,
  redirectTo: string = "/home",
) {
  try {
    console.log(`🔄 Generating magic link for: ${email}`);

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error("❌ Error generating magic link:", error.message, error);
      throw error;
    }

    console.log(`✅ Magic link generated for: ${email}`);
    return data;
  } catch (error) {
    console.error("❌ Failed to generate magic link:", error);
    throw error;
  }
}

/**
 * 🔄 Met à jour le mot de passe d'un utilisateur dans Supabase Auth
 *
 * @param userId - L'ID Supabase de l'utilisateur
 * @param newPassword - Nouveau mot de passe en clair
 */
export async function updateSupabaseUserPassword(
  userId: string,
  newPassword: string,
) {
  try {
    console.log(`🔄 Updating password for Supabase user: ${userId}`);

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: newPassword,
      },
    );

    if (error) {
      console.error("❌ Error updating password:", error.message, error);
      throw error;
    }

    console.log(`✅ Password updated for user: ${userId}`);
    return data.user;
  } catch (error) {
    console.error("❌ Failed to update password:", error);
    throw error;
  }
}

/**
 * 🗑️ Supprime un utilisateur de Supabase Auth
 *
 * @param userId - L'ID Supabase de l'utilisateur
 */
export async function deleteSupabaseAuthUser(userId: string) {
  try {
    console.log(`🔄 Deleting Supabase user: ${userId}`);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error("❌ Error deleting user:", error.message, error);
      throw error;
    }

    console.log(`✅ User deleted from Supabase Auth: ${userId}`);
  } catch (error) {
    console.error("❌ Failed to delete user:", error);
    throw error;
  }
}

/**
 * 🔍 Récupère un utilisateur par email depuis Supabase Auth
 *
 * @param email - Email de l'utilisateur
 */
export async function getSupabaseUserByEmail(email: string) {
  try {
    console.log(`🔄 Looking up Supabase user by email: ${email}`);

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("❌ Error listing users:", error.message, error);
      throw error;
    }

    const user = data.users.find((u) => u.email === email);

    if (user) {
      console.log(
        `✅ Supabase user found: ${user.id} | email_confirmed: ${!!user.email_confirmed_at}`,
      );
    } else {
      console.warn(`⚠️ No Supabase user found for email: ${email}`);
    }

    return user || null;
  } catch (error) {
    console.error("❌ Failed to get user by email:", error);
    throw error;
  }
}
