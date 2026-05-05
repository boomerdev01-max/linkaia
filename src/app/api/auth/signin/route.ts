// app/api/auth/signin/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

const signinSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

/**
 * Tente un signInWithPassword et retourne le résultat.
 * Utilitaire pour éviter la duplication dans les blocs de repair.
 */
async function attemptSignIn(email: string, password: string) {
  const supabase = await createSupabaseServerClient();
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Repair complet d'un user Supabase dont l'état est incohérent.
 *
 * Cas visé : user créé avec email_confirm: false (ancien comportement),
 * dont email_confirmed_at est null même après verify-email.
 *
 * Solution : recréer l'identité Supabase proprement via la REST Admin API.
 * updateUserById seul ne suffit pas — Supabase maintient un état interne
 * séparé de email_confirmed_at qui bloque signInWithPassword.
 */
async function repairSupabaseUser(
  supabaseId: string,
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  console.log(
    `🔧 [repairSupabaseUser] Starting full repair for: ${supabaseId}`,
  );

  const { supabaseUrl, serviceRoleKey } = (() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return { supabaseUrl: url, serviceRoleKey: key };
  })();

  // Étape 1 : forcer email_confirmed_at + password via REST PUT
  console.log(
    `🔧 [repairSupabaseUser] Step 1 — REST PUT email_confirm + password`,
  );
  try {
    const putResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${supabaseId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
        body: JSON.stringify({
          email_confirm: true,
          password,
        }),
      },
    );

    if (!putResponse.ok) {
      const body = await putResponse.text();
      console.error(
        `❌ [repairSupabaseUser] REST PUT failed: ${putResponse.status} — ${body}`,
      );
      return {
        success: false,
        error: `REST PUT failed: ${putResponse.status}`,
      };
    }

    const putResult = await putResponse.json();
    console.log(
      `🔍 [repairSupabaseUser] REST PUT result — email_confirmed_at: ${putResult.email_confirmed_at ?? "⚠️ null"}`,
    );
  } catch (err) {
    console.error(`❌ [repairSupabaseUser] REST PUT exception:`, err);
    return { success: false, error: "REST PUT exception" };
  }

  // Étape 2 : vérifier l'état réel via GET
  console.log(`🔧 [repairSupabaseUser] Step 2 — REST GET to verify state`);
  try {
    const getResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${supabaseId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      },
    );

    if (!getResponse.ok) {
      const body = await getResponse.text();
      console.error(
        `❌ [repairSupabaseUser] REST GET failed: ${getResponse.status} — ${body}`,
      );
    } else {
      const getResult = await getResponse.json();
      console.log(
        `🔍 [repairSupabaseUser] After repair — email_confirmed_at: ${getResult.email_confirmed_at ?? "⚠️ STILL NULL"}`,
        `| last_sign_in_at: ${getResult.last_sign_in_at ?? "never"}`,
      );

      if (!getResult.email_confirmed_at) {
        console.error(
          `❌ [repairSupabaseUser] email_confirmed_at still null after REST PUT.`,
          `\n   This user was created with email_confirm:false and Supabase's internal`,
          `\n   confirmation state cannot be repaired via updateUserById alone.`,
          `\n   The only reliable fix for this legacy user is to DELETE and RECREATE`,
          `\n   in Supabase Auth with email_confirm:true, keeping the same supabaseId.`,
        );
        return {
          success: false,
          error: "email_confirmed_at still null after repair",
        };
      }
    }
  } catch (err) {
    console.error(`❌ [repairSupabaseUser] REST GET exception:`, err);
    // On continue quand même — le GET est informatif, pas bloquant
  }

  // Étape 3 : tentative de connexion après repair
  console.log(
    `🔧 [repairSupabaseUser] Step 3 — signInWithPassword after repair`,
  );
  const { data, error } = await attemptSignIn(email, password);

  if (error) {
    console.error(
      `❌ [repairSupabaseUser] signInWithPassword still failing after repair:`,
      `code=${error.code} | message=${error.message}`,
    );
    return { success: false, error: error.message };
  }

  console.log(`✅ [repairSupabaseUser] Repair + signin SUCCESS for: ${email}`);
  return { success: true };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = signinSchema.parse(body);

    console.log(`\n${"=".repeat(60)}`);
    console.log(`🔄 [SIGNIN] ===== NEW SIGNIN ATTEMPT =====`);
    console.log(`🔄 [SIGNIN] Email: ${email}`);

    // ─────────────────────────────────────────────────────────
    // 1. TROUVER L'UTILISATEUR DANS PRISMA
    // ─────────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.warn(`⚠️ [SIGNIN] User not found in Prisma: ${email}`);
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 },
      );
    }

    console.log(
      `✅ [SIGNIN] Prisma user found: id=${user.id} | supabaseId=${user.supabaseId} | emailVerified=${user.emailVerified}`,
    );

    // ─────────────────────────────────────────────────────────
    // 2. UTILISATEUR OAUTH SANS PASSWORD
    // ─────────────────────────────────────────────────────────
    if (!user.password) {
      return NextResponse.json(
        {
          error: "Ce compte utilise Google OAuth. Connectez-vous avec Google.",
        },
        { status: 401 },
      );
    }

    // ─────────────────────────────────────────────────────────
    // 3. VÉRIFICATION BCRYPT (Prisma)
    // ─────────────────────────────────────────────────────────
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log(
      `🔄 [SIGNIN] bcrypt result: ${passwordMatch ? "✅ MATCH" : "❌ MISMATCH"}`,
    );

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 },
      );
    }

    // ─────────────────────────────────────────────────────────
    // 4. EMAIL VÉRIFIÉ DANS PRISMA
    // ─────────────────────────────────────────────────────────
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: "Email non vérifié",
          needsVerification: true,
          email: user.email,
        },
        { status: 403 },
      );
    }

    // ─────────────────────────────────────────────────────────
    // 5. SUPABASE ID PRÉSENT
    // ─────────────────────────────────────────────────────────
    if (!user.supabaseId) {
      console.error(`❌ [SIGNIN] User has no supabaseId: ${user.id}`);
      return NextResponse.json(
        { error: "Erreur de synchronisation. Contactez le support." },
        { status: 500 },
      );
    }

    // ─────────────────────────────────────────────────────────
    // 6. AUDIT SUPABASE (lecture REST — plus fiable que le SDK)
    // ─────────────────────────────────────────────────────────
    console.log(
      `🔍 [SIGNIN] Reading Supabase state via REST for: ${user.supabaseId}`,
    );

    let supabaseEmailConfirmed = false;
    try {
      const getResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${user.supabaseId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          },
        },
      );

      if (getResponse.ok) {
        const supaRaw = await getResponse.json();
        supabaseEmailConfirmed = !!supaRaw.email_confirmed_at;
        console.log(
          `🔍 [SIGNIN] Supabase REST state:`,
          `\n   email_confirmed_at: ${supaRaw.email_confirmed_at ?? "⚠️ null"}`,
          `\n   last_sign_in_at:    ${supaRaw.last_sign_in_at ?? "never"}`,
          `\n   confirmed:          ${supabaseEmailConfirmed}`,
        );
      } else {
        const body = await getResponse.text();
        console.error(
          `❌ [SIGNIN] REST GET failed: ${getResponse.status} — ${body}`,
        );
      }
    } catch (restErr) {
      console.error(`❌ [SIGNIN] REST GET exception:`, restErr);
    }

    // ─────────────────────────────────────────────────────────
    // 7. TENTATIVE SIGNIN (première, directe)
    // ─────────────────────────────────────────────────────────
    console.log(`🔄 [SIGNIN] Attempting signInWithPassword...`);
    const { data: authData, error: signInError } = await attemptSignIn(
      email,
      password,
    );

    if (!signInError) {
      // ✅ Succès immédiat
      console.log(`✅ [SIGNIN] SUCCESS (first attempt) for: ${email}`);
      console.log(`${"=".repeat(60)}\n`);

      return NextResponse.json({
        success: true,
        message: "Connexion réussie",
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
        },
      });
    }

    // ─────────────────────────────────────────────────────────
    // 8. SIGNIN ÉCHOUÉ — DIAGNOSTIC ET REPAIR
    // ─────────────────────────────────────────────────────────
    console.error(
      `❌ [SIGNIN] signInWithPassword failed:`,
      `\n   code:    ${signInError.code}`,
      `\n   message: ${signInError.message}`,
      `\n   status:  ${signInError.status}`,
    );

    const isEmailNotConfirmed =
      signInError.code === "email_not_confirmed" ||
      signInError.message?.toLowerCase().includes("email not confirmed");

    const isInvalidCredentials =
      signInError.code === "invalid_credentials" ||
      signInError.message?.toLowerCase().includes("invalid login credentials");

    if (
      isEmailNotConfirmed ||
      (!supabaseEmailConfirmed && isInvalidCredentials)
    ) {
      // Cas : email_confirm:false à la création — repair nécessaire
      console.log(
        `🔧 [SIGNIN] Legacy user detected (email_confirm:false at signup).`,
        `\n   Attempting full repair (email_confirm + password re-sync)...`,
      );

      const repair = await repairSupabaseUser(user.supabaseId, email, password);

      if (repair.success) {
        console.log(`✅ [SIGNIN] Repair successful for: ${email}`);
        console.log(`${"=".repeat(60)}\n`);

        return NextResponse.json({
          success: true,
          message: "Connexion réussie",
          user: {
            id: user.id,
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
          },
        });
      }

      // Repair échoué — le user ne peut pas se connecter
      // C'est un user "bloqué" côté Supabase depuis la création avec email_confirm:false
      // La seule solution restante : delete + recreate dans Supabase
      console.error(
        `❌ [SIGNIN] Repair failed for legacy user: ${user.supabaseId}`,
        `\n   This user requires manual intervention:`,
        `\n   1. Delete from Supabase Auth (keep Prisma record)`,
        `\n   2. Recreate in Supabase Auth with email_confirm:true`,
        `\n   3. Update supabaseId in Prisma if new UUID`,
      );

      return NextResponse.json(
        {
          error:
            "Erreur de connexion. Veuillez réinitialiser votre mot de passe.",
        },
        { status: 500 },
      );
    }

    if (isInvalidCredentials && supabaseEmailConfirmed) {
      // Cas : password désynchronisé (email OK, mais hash différent)
      console.error(
        `❌ [SIGNIN] Password desync: bcrypt passed (Prisma) but Supabase rejected.`,
        `\n   Attempting password re-sync in Supabase...`,
      );

      const { error: syncError } =
        await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, {
          password,
        });

      if (syncError) {
        console.error(
          `❌ [SIGNIN] Password re-sync failed:`,
          syncError.message,
        );
        return NextResponse.json(
          {
            error:
              "Erreur lors de la connexion. Réinitialisez votre mot de passe.",
          },
          { status: 500 },
        );
      }

      console.log(`✅ [SIGNIN] Password re-synced. Retrying...`);
      const { data: retryData, error: retryError } = await attemptSignIn(
        email,
        password,
      );

      if (retryError) {
        console.error(
          `❌ [SIGNIN] Retry after re-sync failed:`,
          retryError.message,
        );
        return NextResponse.json(
          {
            error:
              "Erreur lors de la connexion. Réinitialisez votre mot de passe.",
          },
          { status: 500 },
        );
      }

      console.log(`✅ [SIGNIN] SUCCESS after password re-sync for: ${email}`);
      console.log(`${"=".repeat(60)}\n`);

      return NextResponse.json({
        success: true,
        message: "Connexion réussie",
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
        },
      });
    }

    // Erreur inconnue
    console.error(`❌ [SIGNIN] Unhandled signin error: ${signInError.message}`);
    return NextResponse.json(
      {
        error:
          "Erreur lors de la connexion. Réessayez ou réinitialisez votre mot de passe.",
      },
      { status: 500 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }

    console.error("❌ [SIGNIN] Unexpected error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la connexion" },
      { status: 500 },
    );
  }
}
