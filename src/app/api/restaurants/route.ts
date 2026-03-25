import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { parseBody } from "@/lib/api-helpers";
import { restaurantCreateSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

// GET /api/restaurants — list user's restaurants
export async function GET() {
  try {
    const user = await getOrCreateUser();

    const restaurants = await prisma.restaurant.findMany({
      where: { ownerId: user.id },
      include: {
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ restaurants });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST /api/restaurants — create a new restaurant (optionally from Google Places)
export async function POST(request: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const parsed = await parseBody(request, restaurantCreateSchema);
    if ("error" in parsed) return parsed.error;

    const { name, address, googlePlaceId, googleRating, googleReviewCount } = parsed.data;

    // Check plan limits
    const count = await prisma.restaurant.count({
      where: { ownerId: user.id },
    });

    const limits: Record<string, number> = { FREE: 1, PRO: 1, BUSINESS: 10 };
    const max = limits[user.plan] || 1;

    if (count >= max) {
      return NextResponse.json(
        { error: "PLAN_LIMIT", message: `Your plan allows ${max} restaurant(s)` },
        { status: 403 }
      );
    }

    // Check if googlePlaceId already linked to this user
    if (googlePlaceId) {
      const existing = await prisma.restaurant.findFirst({
        where: { googlePlaceId, ownerId: user.id },
      });
      if (existing) {
        return NextResponse.json(
          { error: "ALREADY_LINKED", restaurant: existing },
          { status: 409 }
        );
      }
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        address: address || null,
        googlePlaceId: googlePlaceId || null,
        googleRating: googleRating || null,
        googleReviewCount: googleReviewCount || null,
        ownerId: user.id,
      },
    });

    return NextResponse.json({ restaurant }, { status: 201 });
  } catch (error) {
    logger.error("Create restaurant error", error, { path: "/api/restaurants" });
    return NextResponse.json(
      { error: "Failed to create restaurant" },
      { status: 500 }
    );
  }
}
