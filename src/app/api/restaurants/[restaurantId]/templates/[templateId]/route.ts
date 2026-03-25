import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { parseBody } from "@/lib/api-helpers";
import { templateUpdateSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string; templateId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { restaurantId, templateId } = await params;

    const parsed = await parseBody(request, templateUpdateSchema);
    if ("error" in parsed) return parsed.error;

    // Verify ownership
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, ownerId: user.id },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const template = await prisma.responseTemplate.update({
      where: { id: templateId, restaurantId },
      data: parsed.data,
    });

    return NextResponse.json({ template });
  } catch (error) {
    logger.error("Template update error", error, { path: "/api/restaurants/[id]/templates/[id]" });
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string; templateId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { restaurantId, templateId } = await params;

    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, ownerId: user.id },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.responseTemplate.delete({
      where: { id: templateId, restaurantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Template delete error", error, { path: "/api/restaurants/[id]/templates/[id]" });
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
