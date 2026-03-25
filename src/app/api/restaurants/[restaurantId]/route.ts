import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { parseBody } from "@/lib/api-helpers";
import { restaurantUpdateSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

// PATCH /api/restaurants/[restaurantId] — update restaurant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { restaurantId } = await params;
    const parsed = await parseBody(request, restaurantUpdateSchema);
    if ("error" in parsed) return parsed.error;

    const body = parsed.data;

    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, ownerId: user.id },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        name: body.name ?? restaurant.name,
        address: body.address !== undefined ? body.address : restaurant.address,
        syncEnabled:
          body.syncEnabled !== undefined
            ? body.syncEnabled
            : restaurant.syncEnabled,
      },
    });

    return NextResponse.json({ restaurant: updated });
  } catch (error) {
    logger.error("Restaurant update error", error, { path: "/api/restaurants/[id]" });
    return NextResponse.json(
      { error: "Failed to update restaurant" },
      { status: 500 }
    );
  }
}

// DELETE /api/restaurants/[restaurantId] — delete restaurant
export async function DELETE(
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

    // Don't delete the last restaurant
    const count = await prisma.restaurant.count({
      where: { ownerId: user.id },
    });

    if (count <= 1) {
      return NextResponse.json(
        { error: "Cannot delete your only restaurant" },
        { status: 400 }
      );
    }

    await prisma.restaurant.delete({ where: { id: restaurantId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Restaurant delete error", error, { path: "/api/restaurants/[id]" });
    return NextResponse.json(
      { error: "Failed to delete restaurant" },
      { status: 500 }
    );
  }
}
