import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { requireTeamRole } from "@/lib/rbac";
import { parseBody } from "@/lib/api-helpers";
import { competitorCreateSchema } from "@/lib/validation";
import { getPlanLimits } from "@/lib/plans";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { restaurantId } = await params;

    await requireTeamRole(user.id, restaurantId, "MEMBER");

    const competitors = await prisma.competitor.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      competitors: competitors.map((c) => ({
        id: c.id,
        name: c.name,
        googlePlaceId: c.googlePlaceId,
        googleRating: c.googleRating,
        lastAnalysis: c.lastAnalyzedAt?.toISOString() || null,
        analysisData: c.analysisJson,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    logger.error("Competitors fetch error", error, { path: "/api/restaurants/[id]/competitors" });
    return NextResponse.json({ error: "Failed to fetch competitors" }, { status: 500 });
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
    if (limits.competitors <= 0) {
      return NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 403 });
    }

    await requireTeamRole(user.id, restaurantId, "ADMIN");

    const parsed = await parseBody(request, competitorCreateSchema);
    if ("error" in parsed) return parsed.error;

    // Check limit
    const count = await prisma.competitor.count({ where: { restaurantId } });
    if (count >= limits.competitors) {
      return NextResponse.json({ error: "COMPETITOR_LIMIT" }, { status: 403 });
    }

    const competitor = await prisma.competitor.create({
      data: {
        name: parsed.data.name,
        googlePlaceId: parsed.data.googlePlaceId || "",
        restaurantId,
      },
    });

    return NextResponse.json({
      competitor: {
        id: competitor.id,
        name: competitor.name,
        googlePlaceId: competitor.googlePlaceId,
        googleRating: null,
        lastAnalysis: null,
        analysisData: null,
        createdAt: competitor.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && ["FORBIDDEN", "NOT_FOUND"].includes(error.message)) {
      return NextResponse.json(
        { error: error.message === "FORBIDDEN" ? "Forbidden" : "Not found" },
        { status: error.message === "FORBIDDEN" ? 403 : 404 }
      );
    }
    logger.error("Competitor create error", error, { path: "/api/restaurants/[id]/competitors" });
    return NextResponse.json({ error: "Failed to create competitor" }, { status: 500 });
  }
}
