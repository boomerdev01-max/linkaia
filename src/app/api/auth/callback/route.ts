import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const existingUser = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
      });

      if (!existingUser) {
        // ✨ RÉCUPÉRER LE RÔLE standard_user
        const standardUserRole = await prisma.role.findUnique({
          where: { name: "standard_user" },
        });

        if (!standardUserRole) {
          console.error("❌ Rôle standard_user introuvable");
          return NextResponse.redirect(
            new URL("/signin?error=role_missing", requestUrl.origin),
          );
        }

        // Créer l'utilisateur dans Prisma pour les OAuth users
        const [prenom, ...nomParts] = (
          data.user.user_metadata?.full_name ||
          data.user.email?.split("@")[0] ||
          "User"
        ).split(" ");
        const nom = nomParts.join(" ") || prenom;

        const newUser = await prisma.user.create({
          data: {
            email: data.user.email!,
            nom,
            prenom,
            supabaseId: data.user.id,
            provider: "google",
            emailVerified: true,
          },
        });

        // 8️⃣ ATTRIBUER LE PLAN FREE PAR DÉFAUT
        const freePlan = await prisma.subscriptionType.findUnique({
          where: { code: "FREE" },
        });

        if (freePlan) {
          await prisma.userSubscription.create({
            data: {
              userId: newUser.id,
              subscriptionTypeId: freePlan.id,
              status: "active",
              autoRenew: false,
            },
          });

          await prisma.subscriptionHistory.create({
            data: {
              userId: newUser.id,
              subscriptionTypeId: freePlan.id,
              startDate: new Date(),
              action: "subscribed",
              pricePaid: 0,
              currencyCode: "XOF",
            },
          });

          console.log(`✅ FREE plan assigned to user: ${newUser.id}`);
        }

        // ✨ ATTRIBUER LE RÔLE standard_user
        await prisma.userRole.create({
          data: {
            userId: newUser.id,
            roleId: standardUserRole.id,
          },
        });

        console.log(
          `✅ Google OAuth user created with standard_user role: ${newUser.id}`,
        );
      }
    }
  }

  return NextResponse.redirect(new URL("/home", requestUrl.origin));
}
