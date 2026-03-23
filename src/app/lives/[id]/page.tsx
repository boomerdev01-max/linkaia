// src/app/lives/[id]/page.tsx
// Page Next.js pour rejoindre un live — SSR minimal, composant client LiveRoom

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LiveRoom } from "@/components/lives/LiveRoom";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const live = await prisma.live.findUnique({
      where: { id },
      select: { title: true },
    });
    return { title: live ? `${live.title} · Live Linkaïa` : "Live · Linkaïa" };
  } catch {
    return { title: "Live · Linkaïa" };
  }
}

export default async function LivePage({ params }: PageProps) {
  const { id } = await params;
  return <LiveRoom liveId={id} />;
}
