// lib/supabase/admin-client.ts
import { createClient } from "@supabase/supabase-js";

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

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS INTERNES
// ─────────────────────────────────────────────────────────────────────────────

function getEnvVars() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return { supabaseUrl, serviceRoleKey };
}

/**
 * Appel REST direct sur l'Admin API Supabase.
 * Contourne les limitations de typage du SDK JS qui ignore certaines propriétés.
 */
async function supabaseAdminRestPut(
  userId: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { supabaseUrl, serviceRoleKey } = getEnvVars();

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Supabase Admin REST PUT failed: ${response.status} — ${errorBody}`,
    );
  }

  return response.json();
}

/**
 * Lit l'état réel d'un user via REST (plus fiable que le SDK pour les champs auth).
 */
async function supabaseAdminRestGet(
  userId: string,
): Promise<Record<string, unknown>> {
  const { supabaseUrl, serviceRoleKey } = getEnvVars();

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Supabase Admin REST GET failed: ${response.status} — ${errorBody}`,
    );
  }

  return response.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// CRÉER UN UTILISATEUR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crée un utilisateur dans Supabase Auth.
 *
 * ✅ IMPORTANT: On passe TOUJOURS email_confirm: true ici.
 * La vérification de l'email est gérée côté Prisma avec notre propre système
 * de code à 6 chiffres — on n'a pas besoin que Supabase bloque la connexion.
 * Laisser email_confirm: false crée un état "not confirmed" dans Supabase
 * qui PERSISTE même après un updateUserById et empêche signInWithPassword.
 *
 * ⚠️ Le password est transmis EN CLAIR à Supabase qui le hashe avec son algo.
 * Ce hash est DIFFÉRENT du hash bcrypt stocké dans Prisma — c'est intentionnel.
 * Les deux systèmes vérifient le même plaintext password, chacun avec son hash.
 */
export async function createSupabaseAuthUser(
  email: string,
  password: string,
  metadata?: { nom?: string; prenom?: string },
  // Paramètre conservé pour compatibilité mais ignoré — on force toujours true
  _emailConfirmed: boolean = true,
) {
  console.log(
    `🔄 [createSupabaseAuthUser] Creating user: ${email} (email_confirm: true — always)`,
  );

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // ✅ Toujours true — notre vérification est dans Prisma
    user_metadata: metadata,
  });

  if (error) {
    console.error("❌ [createSupabaseAuthUser] Error:", error.message, error);
    throw error;
  }

  // Vérification immédiate via REST pour confirmer que l'état est bien propagé
  const rawUser = await supabaseAdminRestGet(data.user.id);
  console.log(
    `✅ [createSupabaseAuthUser] Created: ${data.user.id}`,
    `| email_confirmed_at (REST): ${rawUser.email_confirmed_at ?? "⚠️ STILL NULL"}`,
  );

  if (!rawUser.email_confirmed_at) {
    // Ne devrait pas arriver avec email_confirm: true, mais on log pour diagnostic
    console.error(
      `❌ [createSupabaseAuthUser] email_confirmed_at is null after creation with email_confirm:true!`,
      `This is unexpected. Raw response:`,
      JSON.stringify(rawUser, null, 2),
    );
    // On ne throw pas ici — le user est créé, on laisse le signin gérer
  }

  return data.user;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRMER L'EMAIL — gardé pour rétrocompatibilité (anciens users)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ✅ Confirme l'email d'un utilisateur dans Supabase Auth.
 *
 * Utilisé pour les users créés AVANT le fix (email_confirm: false au signup).
 * Les nouveaux users n'en ont plus besoin car ils sont créés avec email_confirm: true.
 *
 * POURQUOI APPEL REST DIRECT et non SDK ?
 * Le SDK TypeScript de Supabase ignore silencieusement certaines propriétés
 * selon la version. L'Admin REST API est plus fiable.
 *
 * ⚠️ ATTENTION : même après un REST PUT réussi, Supabase peut retourner
 * "Email not confirmed" sur signInWithPassword si l'user a été créé avec
 * email_confirm: false. C'est un état interne Supabase qui ne se réinitialise
 * pas toujours via updateUserById. La vraie solution est email_confirm: true
 * dès la création (voir createSupabaseAuthUser).
 */
export async function confirmUserEmail(userId: string) {
  console.log(`🔄 [confirmUserEmail] Confirming email for userId: ${userId}`);

  // Lire l'état AVANT via REST (plus fiable que le SDK)
  const before = await supabaseAdminRestGet(userId);
  console.log(
    `📋 [confirmUserEmail] Before — email_confirmed_at (REST): ${before.email_confirmed_at ?? "null"}`,
  );

  if (before.email_confirmed_at) {
    console.log(
      `ℹ️  [confirmUserEmail] Already confirmed: ${before.email_confirmed_at}`,
    );
    return before;
  }

  // PUT REST avec email_confirm: true
  const updated = await supabaseAdminRestPut(userId, {
    email_confirm: true,
  });

  // Vérifier le champ dans la réponse REST
  console.log(
    `🔍 [confirmUserEmail] REST response email_confirmed_at: ${updated.email_confirmed_at ?? "⚠️ UNDEFINED/NULL"}`,
  );

  // Re-lire via GET REST pour valider (la réponse PUT peut différer de l'état réel)
  const after = await supabaseAdminRestGet(userId);
  console.log(
    `🔍 [confirmUserEmail] After re-read (REST GET) — email_confirmed_at: ${after.email_confirmed_at ?? "⚠️ STILL NULL"}`,
  );

  if (!after.email_confirmed_at) {
    console.error(
      `❌ [confirmUserEmail] email_confirmed_at still null after REST PUT + GET re-read.`,
      `\n   userId: ${userId}`,
      `\n   PUT response: ${JSON.stringify(updated, null, 2)}`,
      `\n   GET re-read:  ${JSON.stringify(after, null, 2)}`,
    );
    throw new Error(
      `confirmUserEmail: email_confirmed_at still null after REST update for userId=${userId}`,
    );
  }

  console.log(
    `✅ [confirmUserEmail] Confirmed. email_confirmed_at: ${after.email_confirmed_at}`,
  );

  return after;
}

// ─────────────────────────────────────────────────────────────────────────────
// METTRE À JOUR LE PASSWORD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Met à jour le password d'un utilisateur dans Supabase Auth.
 * À appeler à chaque changement de password pour maintenir Prisma et Supabase en sync.
 */
export async function updateSupabaseUserPassword(
  userId: string,
  newPassword: string,
) {
  console.log(
    `🔄 [updateSupabaseUserPassword] Updating password for: ${userId}`,
  );

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { password: newPassword },
  );

  if (error) {
    console.error("❌ [updateSupabaseUserPassword] Error:", error.message);
    throw error;
  }

  console.log(
    `✅ [updateSupabaseUserPassword] Password updated for: ${userId}`,
  );
  return data.user;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPRIMER UN UTILISATEUR
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteSupabaseAuthUser(userId: string) {
  console.log(`🔄 [deleteSupabaseAuthUser] Deleting: ${userId}`);

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    console.error("❌ [deleteSupabaseAuthUser] Error:", error.message);
    throw error;
  }

  console.log(`✅ [deleteSupabaseAuthUser] Deleted: ${userId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAGIC LINK
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMagicLink(
  email: string,
  redirectTo: string = "/home",
) {
  console.log(`🔄 [generateMagicLink] Generating for: ${email}`);

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (error) {
    console.error("❌ [generateMagicLink] Error:", error.message);
    throw error;
  }

  console.log(`✅ [generateMagicLink] Generated for: ${email}`);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP PAR EMAIL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ⚠️ listUsers() charge TOUS les users — à éviter en prod avec beaucoup d'inscrits.
 * Préférer de stocker supabaseId dans Prisma (déjà fait) et utiliser getUserById.
 */
export async function getSupabaseUserByEmail(email: string) {
  console.log(`🔄 [getSupabaseUserByEmail] Looking up: ${email}`);

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error("❌ [getSupabaseUserByEmail] Error:", error.message);
    throw error;
  }

  const user = data.users.find((u) => u.email === email) || null;

  if (user) {
    console.log(
      `✅ [getSupabaseUserByEmail] Found: ${user.id} | confirmed: ${!!user.email_confirmed_at}`,
    );
  } else {
    console.warn(`⚠️ [getSupabaseUserByEmail] Not found: ${email}`);
  }

  return user;
}
