import { NextRequest, NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

interface SerpApiReview {
  snippet?: string;
  extracted_snippet?: { original?: string };
  rating?: number;
  user?: { name?: string };
}

interface SerpApiResponse {
  reviews?: SerpApiReview[];
  place_info?: {
    title?: string;
    address?: string;
    rating?: number;
    reviews?: number;
  };
  serpapi_pagination?: {
    next_page_token?: string;
    next?: string;
  };
  error?: string;
}

const MAX_PAGES = 15;
const MAX_REVIEWS = 150;

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimited = rateLimit(request, "places-reviews", RATE_LIMITS.places);
    if (rateLimited) return rateLimited;

    const placeId = request.nextUrl.searchParams.get("place_id");

    if (!placeId) {
      return NextResponse.json(
        { error: "Missing place_id" },
        { status: 400 }
      );
    }

    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "SerpAPI key not configured" },
        { status: 500 }
      );
    }

    const allReviews: string[] = [];
    let nextPageToken: string | null = null;
    let placeInfo = null;

    for (let page = 0; page < MAX_PAGES; page++) {
      const params = new URLSearchParams({
        engine: "google_maps_reviews",
        place_id: placeId,
        api_key: apiKey,
        sort_by: "newestFirst",
        hl: "fr",
      });

      if (nextPageToken) {
        params.set("next_page_token", nextPageToken);
      }

      const res = await fetch(`https://serpapi.com/search.json?${params}`);
      const data: SerpApiResponse = await res.json();

      if (data.error) {
        logger.error("SerpAPI error", data.error, { path: "/api/places/reviews" });
        if (page === 0) {
          return NextResponse.json(
            { error: data.error },
            { status: 500 }
          );
        }
        break;
      }

      if (page === 0 && data.place_info) {
        placeInfo = {
          name: data.place_info.title || "",
          address: data.place_info.address || "",
          rating: data.place_info.rating || 0,
          totalReviews: data.place_info.reviews || 0,
        };
      }

      if (data.reviews && data.reviews.length > 0) {
        for (const review of data.reviews) {
          const text =
            review.snippet ||
            review.extracted_snippet?.original ||
            "";
          if (text.length > 10) {
            allReviews.push(text);
          }
          if (allReviews.length >= MAX_REVIEWS) break;
        }
      }

      if (
        allReviews.length >= MAX_REVIEWS ||
        !data.serpapi_pagination?.next_page_token
      ) {
        break;
      }

      nextPageToken = data.serpapi_pagination.next_page_token;
    }

    return NextResponse.json({
      reviews: allReviews,
      placeInfo,
      fetchedCount: allReviews.length,
    });
  } catch (error) {
    logger.error("Reviews fetch error", error, { path: "/api/places/reviews" });
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
