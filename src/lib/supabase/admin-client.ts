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
      "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
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
  emailConfirmed: boolean = false
) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: emailConfirmed, // Si false, Supabase considère l'email non vérifié
      user_metadata: metadata,
    });

    if (error) {
      console.error("❌ Error creating Supabase auth user:", error);
      throw error;
    }

    console.log(`✅ User created in Supabase Auth: ${data.user.id}`);
    return data.user;
  } catch (error) {
    console.error("❌ Failed to create Supabase user:", error);
    throw error;
  }
}

/**
 * ✅ Confirme l'email d'un utilisateur dans Supabase Auth
 * 
 * Utile après vérification custom du code email
 * 
 * @param userId - L'ID Supabase de l'utilisateur
 */
export async function confirmUserEmail(userId: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email_confirm: true,
      }
    );

    if (error) {
      console.error("❌ Error confirming email:", error);
      throw error;
    }

    console.log(`✅ Email confirmed for user: ${userId}`);
    return data.user;
  } catch (error) {
    console.error("❌ Failed to confirm email:", error);
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
  redirectTo: string = "/home"
) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error("❌ Error generating magic link:", error);
      throw error;
    }

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
  newPassword: string
) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: newPassword,
      }
    );

    if (error) {
      console.error("❌ Error updating password:", error);
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
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error("❌ Error deleting user:", error);
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
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("❌ Error listing users:", error);
      throw error;
    }

    const user = data.users.find((u) => u.email === email);
    return user || null;
  } catch (error) {
    console.error("❌ Failed to get user by email:", error);
    throw error;
  }
}