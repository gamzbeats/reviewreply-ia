import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { syncGoogleReviews } from "@/lib/sync";
import { logger } from "@/lib/logger";

// POST /api/restaurants/[restaurantId]/sync — trigger manual sync
export async function POST(
  _request: NextRequest,
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

    if (!restaurant.googlePlaceId) {
      return NextResponse.json(
        { error: "Restaurant not linked to Google" },
        { status: 400 }
      );
    }

    const result = await syncGoogleReviews(restaurantId);

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Sync error", error, { path: "/api/restaurants/[id]/sync" });
    return NextResponse.json(
      { error: "Failed to sync reviews" },
      { status: 500 }
    );
  }
}
