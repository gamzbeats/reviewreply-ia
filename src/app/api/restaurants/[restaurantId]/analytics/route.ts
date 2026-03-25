import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
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

    // Accept days param (default 84 = 12 weeks)
    const daysParam = request.nextUrl.searchParams.get("days");
    const days = daysParam ? Math.min(365, Math.max(7, parseInt(daysParam) || 84)) : 84;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const reviews = await prisma.review.findMany({
      where: { restaurantId, createdAt: { gte: startDate } },
      select: {
        sentiment: true,
        sentimentScore: true,
        rating: true,
        createdAt: true,
        responses: { select: { id: true }, take: 1 },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by week
    const weeklyData: Record<
      string,
      {
        week: string;
        positive: number;
        neutral: number;
        negative: number;
        total: number;
        avgRating: number;
        ratings: number[];
        responded: number;
      }
    > = {};

    for (const review of reviews) {
      const date = new Date(review.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().split("T")[0];

      if (!weeklyData[key]) {
        weeklyData[key] = {
          week: key,
          positive: 0,
          neutral: 0,
          negative: 0,
          total: 0,
          avgRating: 0,
          ratings: [],
          responded: 0,
        };
      }

      const w = weeklyData[key];
      w.total++;
      w.ratings.push(review.rating);

      if (review.sentiment === "POSITIVE") w.positive++;
      else if (review.sentiment === "NEGATIVE") w.negative++;
      else w.neutral++;

      if (review.responses.length > 0) w.responded++;
    }

    const sentimentOverTime = Object.values(weeklyData).map((w) => ({
      week: w.week,
      positive: w.positive,
      neutral: w.neutral,
      negative: w.negative,
      total: w.total,
      avgRating:
        w.ratings.length > 0
          ? Number(
              (w.ratings.reduce((a, b) => a + b, 0) / w.ratings.length).toFixed(
                1
              )
            )
          : 0,
      responseRate:
        w.total > 0 ? Number(((w.responded / w.total) * 100).toFixed(0)) : 0,
    }));

    // Rating distribution
    const ratingDist = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: reviews.filter((r) => r.rating === rating).length,
    }));

    // Overall response rate
    const totalWithResponse = reviews.filter(
      (r) => r.responses.length > 0
    ).length;
    const responseRate =
      reviews.length > 0
        ? Number(((totalWithResponse / reviews.length) * 100).toFixed(0))
        : 0;

    return NextResponse.json({
      sentimentOverTime,
      ratingDistribution: ratingDist,
      responseRate,
      totalReviews: reviews.length,
    });
  } catch (error) {
    logger.error("Analytics error", error, { path: "/api/restaurants/[id]/analytics" });
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
