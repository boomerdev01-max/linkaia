// src/app/api/cities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const countryCode = searchParams.get("country") ?? undefined;

  if (search.length < 2) {
    return NextResponse.json({ cities: [] });
  }

  const cities = await prisma.city.findMany({
    where: {
      AND: [
        countryCode ? { countryCode } : {},
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { displayName: { contains: search, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      stateName: true,
      countryCode: true,
      countryName: true,
      displayName: true,
      latitude: true,
      longitude: true,
    },
    take: 20, // max 20 résultats par recherche
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ cities });
}
