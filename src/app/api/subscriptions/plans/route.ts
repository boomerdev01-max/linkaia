// app/api/subscriptions/plans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const plans = await prisma.subscriptionType.findMany({
      where: { isActive: true },
      include: {
        features: {
          orderBy: { featureKey: "asc" },
        },
        currency: true,
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch plans" },
      { status: 500 },
    );
  }
}
