// src/app/ads/page.tsx
// Page annonceur : tableau de bord des campagnes

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { checkAdvertiserEligibility } from "@/lib/ad-server";
import AdsClient from "@/components/ads/AdsClient";

export default async function AdsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) redirect("/signin");

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      level: true,
      profil: { select: { profilePhotoUrl: true, pseudo: true } },
      companyProfile: { select: { companyName: true, status: true } },
    },
  });

  if (!user) redirect("/signin");

  const { eligible, reason } = await checkAdvertiserEligibility(user.id);

  return (
    <AdsClient
      user={{
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        level: user.level,
        profilePhotoUrl: user.profil?.profilePhotoUrl ?? null,
        pseudo: user.profil?.pseudo ?? null,
        companyName: user.companyProfile?.companyName ?? null,
        isEligible: eligible,
        ineligibilityReason: reason ?? null,
      }}
    />
  );
}
