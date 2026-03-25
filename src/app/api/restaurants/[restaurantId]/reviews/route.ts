import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { parseBody } from "@/lib/api-helpers";
import { deleteReviewSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import type { Review as DbReview, GeneratedResponse as DbResponse } from "@/generated/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { restaurantId } = await params;

    // Verify ownership
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, ownerId: user.id },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const sentiment = searchParams.get("sentiment")?.toUpperCase();
    const source = searchParams.get("source")?.toUpperCase();
    const sort = searchParams.get("sort") || "createdAt_desc";
    const search = searchParams.get("search") || "";

    // Build where clause
    const where: Record<string, unknown> = { restaurantId };
    if (sentiment && ["POSITIVE", "NEUTRAL", "NEGATIVE"].includes(sentiment)) {
      where.sentiment = sentiment;
    }
    if (source && ["GOOGLE", "TRIPADVISOR", "YELP", "OTHER"].includes(source)) {
      where.source = source;
    }
    if (search) {
      where.OR = [
        { content: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build orderBy
    const sortMap: Record<string, Record<string, string>> = {
      createdAt_desc: { createdAt: "desc" },
      createdAt_asc: { createdAt: "asc" },
      rating_desc: { rating: "desc" },
      rating_asc: { rating: "asc" },
    };
    const orderBy = sortMap[sort] || { createdAt: "desc" };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { responses: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    // Map to frontend format
    const mapped = reviews.map((r: DbReview & { responses: DbResponse[] }) => ({
      id: r.id,
      author: r.author,
      source: r.source.toLowerCase(),
      rating: r.rating,
      content: r.content,
      sentiment: r.sentiment?.toLowerCase() || "neutral",
      sentimentScore: r.sentimentScore || 0.5,
      createdAt: r.createdAt.toISOString(),
      response: r.responses[0]
        ? {
            id: r.responses[0].id,
            reviewId: r.id,
            content: r.responses[0].content,
            generatedAt: r.responses[0].createdAt.toISOString(),
            copied: r.responses[0].wasUsed,
          }
        : undefined,
    }));

    return NextResponse.json({
      reviews: mapped,
      restaurantId,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error("Reviews fetch error", error, { path: "/api/restaurants/[id]/reviews" });
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { restaurantId } = await params;
    const parsed = await parseBody(request, deleteReviewSchema);
    if ("error" in parsed) return parsed.error;

    const { reviewId } = parsed.data;

    // Verify ownership
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, ownerId: user.id },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.review.delete({
      where: { id: reviewId, restaurantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Review delete error", error, { path: "/api/restaurants/[id]/reviews" });
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
