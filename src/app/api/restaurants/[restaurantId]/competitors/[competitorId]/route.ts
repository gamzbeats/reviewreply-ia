import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { requireTeamRole } from "@/lib/rbac";
import { getOpenAI } from "@/lib/openai";
import { getCompetitorAnalysisPrompt } from "@/lib/prompts";
import { logger } from "@/lib/logger";

type Params = Promise<{ restaurantId: string; competitorId: string }>;

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const user = await getOrCreateUser();
    const { restaurantId, competitorId } = await params;

    await requireTeamRole(user.id, restaurantId, "ADMIN");

    await prisma.competitor.delete({
      where: { id: competitorId, restaurantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && ["FORBIDDEN", "NOT_FOUND"].includes(error.message)) {
      return NextResponse.json(
        { error: error.message === "FORBIDDEN" ? "Forbidden" : "Not found" },
        { status: error.message === "FORBIDDEN" ? 403 : 404 }
      );
    }
    logger.error("Competitor delete error", error, { path: "/api/restaurants/[id]/competitors/[id]" });
    return NextResponse.json({ error: "Failed to delete competitor" }, { status: 500 });
  }
}

// POST = run analysis on competitor's reviews
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const user = await getOrCreateUser();
    const { restaurantId, competitorId } = await params;

    await requireTeamRole(user.id, restaurantId, "MEMBER");

    const competitor = await prisma.competitor.findFirst({
      where: { id: competitorId, restaurantId },
    });

    if (!competitor) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fetch reviews if we have a placeId
    let reviews: string[] = [];
    if (competitor.googlePlaceId) {
      const apiKey = process.env.SERPAPI_API_KEY;
      if (apiKey) {
        const serpParams = new URLSearchParams({
          engine: "google_maps_reviews",
          place_id: competitor.googlePlaceId,
          api_key: apiKey,
          sort_by: "newestFirst",
          hl: "fr",
        });

        const serpRes = await fetch(`https://serpapi.com/search.json?${serpParams}`);
        const serpData = await serpRes.json();

        if (serpData.reviews) {
          reviews = serpData.reviews
            .map((r: { snippet?: string; extracted_snippet?: { original?: string } }) =>
              r.snippet || r.extracted_snippet?.original || ""
            )
            .filter((t: string) => t.length > 10)
            .slice(0, 50);
        }
      }
    }

    // Accept reviews from body if no placeId reviews
    if (reviews.length === 0) {
      try {
        const body = await request.json();
        if (Array.isArray(body.reviews)) {
          reviews = body.reviews.filter((r: string) => typeof r === "string" && r.length > 10).slice(0, 50);
        }
      } catch {
        // no body provided
      }
    }

    if (reviews.length < 3) {
      return NextResponse.json(
        { error: "NOT_ENOUGH_REVIEWS", count: reviews.length },
        { status: 400 }
      );
    }

    // Analyze with OpenAI
    const locale = request.nextUrl.searchParams.get("locale") || "fr";
    const formattedReviews = reviews
      .map((r, i) => `[Review ${i + 1}]: "${r}"`)
      .join("\n\n");

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: getCompetitorAnalysisPrompt(locale) },
        { role: "user", content: formattedReviews },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const analysisData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    // Save analysis
    await prisma.competitor.update({
      where: { id: competitorId },
      data: {
        lastAnalyzedAt: new Date(),
        analysisJson: analysisData,
      },
    });

    return NextResponse.json({
      analysis: analysisData,
      reviewCount: reviews.length,
    });
  } catch (error) {
    if (error instanceof Error && ["FORBIDDEN", "NOT_FOUND"].includes(error.message)) {
      return NextResponse.json(
        { error: error.message === "FORBIDDEN" ? "Forbidden" : "Not found" },
        { status: error.message === "FORBIDDEN" ? 403 : 404 }
      );
    }
    logger.error("Competitor analysis error", error, { path: "/api/restaurants/[id]/competitors/[id]" });
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
