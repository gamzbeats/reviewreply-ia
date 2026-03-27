import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

interface SerpApiReview {
  review_id?: string;
  snippet?: string;
  extracted_snippet?: { original?: string };
  rating?: number;
  user?: { name?: string };
  iso_date?: string;
}

interface SerpApiResponse {
  reviews?: SerpApiReview[];
  serpapi_pagination?: { next_page_token?: string };
  error?: string;
}

const MAX_PAGES = 15;
const MAX_REVIEWS = 150;

function stableId(restaurantId: string, text: string): string {
  const src = `${restaurantId}:${text.slice(0, 80)}`;
  let h = 0;
  for (let i = 0; i < src.length; i++) {
    h = Math.imul(31, h) + src.charCodeAt(i) | 0;
  }
  return `gen_${Math.abs(h).toString(36)}`;
}

function sentimentFromRating(rating: number): { sentiment: "POSITIVE" | "NEGATIVE"; score: number } {
  if (rating >= 4) return { sentiment: "POSITIVE", score: 0.85 };
  if (rating <= 2) return { sentiment: "NEGATIVE", score: 0.15 };
  return { sentiment: "POSITIVE", score: 0.55 }; // 3★ → lean positive
}

export async function POST(
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
    if (!restaurant.googlePlaceId) {
      return NextResponse.json(
        { error: "No Google Place ID linked to this restaurant" },
        { status: 400 }
      );
    }

    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "SerpAPI not configured" }, { status: 500 });
    }

    // Fetch reviews from SerpAPI
    const fetched: SerpApiReview[] = [];
    let nextPageToken: string | null = null;

    for (let page = 0; page < MAX_PAGES; page++) {
      const params = new URLSearchParams({
        engine: "google_maps_reviews",
        place_id: restaurant.googlePlaceId,
        api_key: apiKey,
        sort_by: "newestFirst",
        hl: "fr",
      });
      if (nextPageToken) params.set("next_page_token", nextPageToken);

      const res = await fetch(`https://serpapi.com/search.json?${params}`);
      const data: SerpApiResponse = await res.json();

      if (data.error) {
        logger.error("SerpAPI sync error", data.error);
        if (page === 0) return NextResponse.json({ error: data.error }, { status: 500 });
        break;
      }

      if (data.reviews) {
        for (const r of data.reviews) {
          const text = r.snippet || r.extracted_snippet?.original || "";
          if (text.length > 10) fetched.push(r);
          if (fetched.length >= MAX_REVIEWS) break;
        }
      }

      if (fetched.length >= MAX_REVIEWS || !data.serpapi_pagination?.next_page_token) break;
      nextPageToken = data.serpapi_pagination.next_page_token;
    }

    // Save to DB with upsert (deduplication via googleReviewId)
    let imported = 0;
    let skipped = 0;

    for (const r of fetched) {
      const text = r.snippet || r.extracted_snippet?.original || "";
      const googleReviewId = r.review_id || stableId(restaurantId, text);
      const rating = r.rating ?? 3;
      const { sentiment, score } = sentimentFromRating(rating);

      try {
        const result = await prisma.review.upsert({
          where: { googleReviewId },
          create: {
            author: r.user?.name || "Anonyme",
            source: "GOOGLE",
            rating,
            content: text,
            sentiment,
            sentimentScore: score,
            googleReviewId,
            reviewDate: r.iso_date ? new Date(r.iso_date) : null,
            restaurantId,
          },
          update: {},
        });
        if (result) imported++;
      } catch {
        skipped++;
      }
    }

    return NextResponse.json({ imported, skipped, total: fetched.length });
  } catch (error) {
    logger.error("Sync reviews error", error, { path: "/api/restaurants/[id]/sync-reviews" });
    return NextResponse.json({ error: "Failed to sync reviews" }, { status: 500 });
  }
}
