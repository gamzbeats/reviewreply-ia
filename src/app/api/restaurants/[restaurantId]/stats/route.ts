import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { restaurantId } = await params;

    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, ownerId: user.id },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalReviews, sentimentCounts, recentReviews, avgRating] =
      await Promise.all([
        prisma.review.count({ where: { restaurantId } }),
        prisma.review.groupBy({
          by: ["sentiment"],
          where: { restaurantId },
          _count: true,
        }),
        prisma.review.count({
          where: { restaurantId, createdAt: { gte: sevenDaysAgo } },
        }),
        prisma.review.aggregate({
          where: { restaurantId },
          _avg: { rating: true },
        }),
      ]);

    const sentimentMap: Record<string, number> = {};
    for (const s of sentimentCounts) {
      if (s.sentiment) {
        sentimentMap[s.sentiment.toLowerCase()] = s._count;
      }
    }

    // Reviews with responses
    const responded = await prisma.review.count({
      where: {
        restaurantId,
        responses: { some: {} },
      },
    });

    return NextResponse.json({
      totalReviews,
      avgRating: avgRating._avg.rating
        ? Number(avgRating._avg.rating.toFixed(1))
        : null,
      recentReviews,
      responseRate:
        totalReviews > 0
          ? Number(((responded / totalReviews) * 100).toFixed(0))
          : 0,
      sentiment: {
        positive: sentimentMap.positive || 0,
        neutral: sentimentMap.neutral || 0,
        negative: sentimentMap.negative || 0,
      },
      googleRating: restaurant.googleRating,
      lastSyncAt: restaurant.lastSyncAt,
    });
  } catch (error) {
    logger.error("Stats error", error, { path: "/api/restaurants/[id]/stats" });
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
