import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncGoogleReviews } from "@/lib/sync";
import { logger } from "@/lib/logger";

// POST /api/cron/sync-reviews — Vercel Cron: sync all enabled restaurants
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const restaurants = await prisma.restaurant.findMany({
      where: {
        syncEnabled: true,
        googlePlaceId: { not: null },
      },
      include: { owner: { select: { plan: true } } },
    });

    const results = [];

    for (const restaurant of restaurants) {
      try {
        const result = await syncGoogleReviews(restaurant.id);
        results.push({
          restaurantId: restaurant.id,
          name: restaurant.name,
          ...result,
        });
      } catch (error) {
        results.push({
          restaurantId: restaurant.id,
          name: restaurant.name,
          error: String(error),
        });
      }
    }

    return NextResponse.json({
      synced: results.length,
      results,
    });
  } catch (error) {
    logger.error("Cron sync error", error, { path: "/api/cron/sync-reviews" });
    return NextResponse.json(
      { error: "Cron sync failed" },
      { status: 500 }
    );
  }
}
