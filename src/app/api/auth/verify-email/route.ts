// app/api/auth/verify-email/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { confirmUserEmail } from "@/lib/supabase/admin-client";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code } = verifySchema.parse(body);

    // 1️⃣ TROUVER L'UTILISATEUR DANS PRISMA
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email déjà vérifié" },
        { status: 400 }
      );
    }

    // 2️⃣ VÉRIFIER LE CODE
    if (user.verificationCode !== code) {
      return NextResponse.json(
        { error: "Code de vérification invalide" },
        { status: 400 }
      );
    }

    // 3️⃣ VÉRIFIER L'EXPIRATION
    if (
      user.verificationCodeExpiry &&
      user.verificationCodeExpiry < new Date()
    ) {
      return NextResponse.json(
        { error: "Code de vérification expiré" },
        { status: 400 }
      );
    }

    // 4️⃣ VÉRIFIER QUE L'UTILISATEUR EXISTE DANS SUPABASE
    if (!user.supabaseId) {
      console.error("❌ User has no supabaseId:", user.id);
      return NextResponse.json(
        { error: "Erreur de synchronisation. Contactez le support." },
        { status: 500 }
      );
    }

    try {
      // 5️⃣ CONFIRMER L'EMAIL DANS SUPABASE AUTH
      await confirmUserEmail(user.supabaseId);
      console.log(
        `✅ Email confirmed in Supabase for user: ${user.supabaseId}`
      );

      // 6️⃣ METTRE À JOUR PRISMA
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationCode: null,
          verificationCodeExpiry: null,
        },
      });
      console.log(`✅ Email verified in Prisma for user: ${user.id}`);
    } catch (error) {
      console.error("❌ Error confirming email:", error);
      return NextResponse.json(
        { error: "Erreur lors de la confirmation de l'email" },
        { status: 500 }
      );
    }

    // 7️⃣ CONNECTER AUTOMATIQUEMENT L'UTILISATEUR
    // ⚠️ On ne peut pas connecter directement avec signInWithPassword ici
    // car on n'a plus le password en clair (il est hashé dans Prisma)
    //
    // SOLUTION : On demande à l'utilisateur de se connecter manuellement
    // OU on utilise un magic link (mais complexe dans une API route)
    //
    // Pour l'instant, on retourne success et on redirige vers signin

    return NextResponse.json({
      success: true,
      message:
        "Email vérifié avec succès ! Vous pouvez maintenant vous connecter.",
      needsLogin: true, // ⚠️ Frontend doit rediriger vers /signin
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("❌ Verify email error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la vérification" },
      { status: 500 }
    );
  }
}
