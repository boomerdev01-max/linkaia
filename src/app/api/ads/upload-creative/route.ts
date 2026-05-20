// src/app/api/ads/upload-creative/route.ts
// Upload de l'image créative d'une campagne publicitaire

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { uploadAdCreativeImage } from "@/lib/supabase/ad-creative-storage";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (!user || error) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const campaignId = formData.get("campaignId") as string | null;

    if (!file || !campaignId) {
      return NextResponse.json(
        { error: "Image et campaignId requis" },
        { status: 400 },
      );
    }

    // Vérifier que la campagne appartient bien à cet utilisateur
    const campaign = await prisma.adCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign || campaign.advertiserId !== user.id) {
      return NextResponse.json(
        { error: "Campagne introuvable ou accès refusé" },
        { status: 403 },
      );
    }

    const imageUrl = await uploadAdCreativeImage(file, user.id, campaignId);

    // Mettre à jour le créatif avec l'URL de l'image
    await prisma.adCreative.update({
      where: { campaignId },
      data: { imageUrl },
    });

    return NextResponse.json({ success: true, imageUrl });
  } catch (err: any) {
    console.error("❌ POST /api/ads/upload-creative:", err);
    return NextResponse.json(
      { error: err.message ?? "Erreur upload" },
      { status: 500 },
    );
  }
}