import { NextResponse } from "next/server";
import { getOrCreateUser, getActiveRestaurant } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    const restaurant = await getActiveRestaurant(user.id);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      restaurantId: restaurant?.id || null,
      restaurantName: restaurant?.name || null,
      restaurants: user.restaurants.map((r) => ({
        id: r.id,
        name: r.name,
        googlePlaceId: r.googlePlaceId,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
