import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { parseBody } from "@/lib/api-helpers";
import { templateCreateSchema } from "@/lib/validation";
import { getPlanLimits } from "@/lib/plans";
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

    const templates = await prisma.responseTemplate.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    logger.error("Templates fetch error", error, { path: "/api/restaurants/[id]/templates" });
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { restaurantId } = await params;

    // Check plan
    const limits = getPlanLimits(user.plan);
    if (!limits.templates) {
      return NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 403 });
    }

    const parsed = await parseBody(request, templateCreateSchema);
    if ("error" in parsed) return parsed.error;

    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, ownerId: user.id },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const template = await prisma.responseTemplate.create({
      data: {
        ...parsed.data,
        restaurantId,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    logger.error("Template create error", error, { path: "/api/restaurants/[id]/templates" });
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
