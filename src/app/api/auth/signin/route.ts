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

    // 1️⃣ TROUVER L'UTILISATEUR DANS PRISMA
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // 2️⃣ VÉRIFIER SI C'EST UN UTILISATEUR OAUTH (pas de password)
    if (!user.password) {
      return NextResponse.json(
        {
          error: "Ce compte utilise Google OAuth. Connectez-vous avec Google.",
        },
        { status: 401 }
      );
    }

    // 3️⃣ VÉRIFIER LE MOT DE PASSE AVEC BCRYPT (hash stocké dans Prisma)
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // 4️⃣ VÉRIFIER SI L'EMAIL EST VÉRIFIÉ
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: "Email non vérifié",
          needsVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    // 5️⃣ VÉRIFIER QUE L'UTILISATEUR EXISTE DANS SUPABASE
    if (!user.supabaseId) {
      console.error("❌ User has no supabaseId:", user.id);
      return NextResponse.json(
        { error: "Erreur de synchronisation. Contactez le support." },
        { status: 500 }
      );
    }

    // 6️⃣ CONNECTER VIA SUPABASE AUTH
    // ✅ CLEF DU PROBLÈME : On doit utiliser le password en clair avec Supabase
    // Supabase va comparer avec SON hash (pas celui de Prisma)
    const supabase = await createSupabaseServerClient();

    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password, // ⚠️ Password en clair - Supabase va vérifier avec son propre hash
      });

    if (signInError) {
      console.error("❌ Supabase sign in error:", signInError);

      // Si Supabase refuse, c'est que le password ne correspond pas
      // (peut arriver si l'user a changé son password côté Prisma seulement)
      return NextResponse.json(
        {
          error:
            "Erreur lors de la connexion. Réinitialisez votre mot de passe.",
        },
        { status: 500 }
      );
    }

    // 7️⃣ SESSION CRÉÉE AVEC SUCCÈS ! 🎉
    console.log(`✅ User signed in: ${authData.user.id}`);

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
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("❌ Signin error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la connexion" },
      { status: 500 }
    );
  }
}
