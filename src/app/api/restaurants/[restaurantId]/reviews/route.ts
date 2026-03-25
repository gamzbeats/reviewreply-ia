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

    const reviews = await prisma.review.findMany({
      where: { restaurantId },
      include: { responses: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    });

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

    return NextResponse.json({ reviews: mapped, restaurantId });
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
