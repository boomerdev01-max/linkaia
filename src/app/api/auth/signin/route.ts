// app/api/auth/signin/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

const signinSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = signinSchema.parse(body);

    console.log(`🔄 [SIGNIN] Attempt for: ${email}`);

    // 1️⃣ TROUVER L'UTILISATEUR DANS PRISMA
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.warn(`⚠️ [SIGNIN] User not found in Prisma: ${email}`);
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 },
      );
    }

    /*console.log(
      `✅ [SIGNIN] User found in Prisma: ${user.id} | provider: ${user.provider} | emailVerified: ${user.emailVerified} | hasPassword: ${!!user.password} | hasSupabaseId: ${!!user.supabaseId}`,
    );*/

    // 2️⃣ VÉRIFIER SI C'EST UN UTILISATEUR OAUTH (pas de password)
    if (!user.password) {
      console.warn(`⚠️ [SIGNIN] OAuth user tried password login: ${email}`);
      return NextResponse.json(
        {
          error: "Ce compte utilise Google OAuth. Connectez-vous avec Google.",
        },
        { status: 401 },
      );
    }

    // 3️⃣ VÉRIFIER LE MOT DE PASSE AVEC BCRYPT (hash stocké dans Prisma)
    /*console.log(
      `🔄 [SIGNIN] Comparing password with bcrypt | hash prefix: ${user.password.substring(0, 7)}`,
    );*/
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.warn(
        `⚠️ [SIGNIN] Password mismatch for: ${email} | hash prefix: ${user.password.substring(0, 7)}`,
      );
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 },
      );
    }

    //console.log(`✅ [SIGNIN] Password match OK for: ${email}`);

    // 4️⃣ VÉRIFIER SI L'EMAIL EST VÉRIFIÉ
    if (!user.emailVerified) {
      console.warn(`⚠️ [SIGNIN] Email not verified in Prisma for: ${email}`);
      return NextResponse.json(
        {
          error: "Email non vérifié",
          needsVerification: true,
          email: user.email,
        },
        { status: 403 },
      );
    }

    //console.log(`✅ [SIGNIN] Email verified in Prisma for: ${email}`);

    // 5️⃣ VÉRIFIER QUE L'UTILISATEUR EXISTE DANS SUPABASE
    if (!user.supabaseId) {
      console.error(`❌ [SIGNIN] User has no supabaseId in Prisma: ${user.id}`);
      return NextResponse.json(
        { error: "Erreur de synchronisation. Contactez le support." },
        { status: 500 },
      );
    }

    // 6️⃣ CONNECTER VIA SUPABASE AUTH
    // Supabase compare le password en clair avec SON propre hash (indépendant de Prisma)
    /*console.log(
      `🔄 [SIGNIN] Attempting Supabase signInWithPassword for: ${email}`,
    );*/
    const supabase = await createSupabaseServerClient();

    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      console.error(
        `❌ [SIGNIN] Supabase signInWithPassword failed for: ${email}`,
        {
          code: signInError.code,
          message: signInError.message,
          status: signInError.status,
        },
      );

      // Cas particulier : email non confirmé côté Supabase
      // (peut arriver si confirmUserEmail a échoué silencieusement lors du verify)
      if (signInError.message?.toLowerCase().includes("email not confirmed")) {
        console.error(
          `❌ [SIGNIN] Email not confirmed in Supabase for supabaseId: ${user.supabaseId} — confirmUserEmail may have failed`,
        );
        return NextResponse.json(
          {
            error: "Erreur de confirmation d'email. Contactez le support.",
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          error:
            "Erreur lors de la connexion. Réinitialisez votre mot de passe.",
        },
        { status: 500 },
      );
    }

    // 7️⃣ SESSION CRÉÉE AVEC SUCCÈS ! 🎉
    //console.log(
    //`✅ [SIGNIN] Success for: ${email} | supabaseId: ${authData.user.id} | session: ${!!authData.session}`,
    //);

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
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn(`⚠️ [SIGNIN] Zod validation error:`, error.issues);
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
