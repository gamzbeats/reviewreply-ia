import { NextRequest, NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

interface PlaceSuggestion {
  placePrediction?: {
    placeId: string;
    text: { text: string };
    structuredFormat: {
      mainText: { text: string };
      secondaryText: { text: string };
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimited = rateLimit(request, "places", RATE_LIMITS.places);
    if (rateLimited) return rateLimited;

    const query = request.nextUrl.searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ predictions: [] });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Places API key not configured" },
        { status: 500 }
      );
    }

    const res = await fetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
        },
        body: JSON.stringify({
          input: query,
          includedPrimaryTypes: [
            "restaurant",
            "cafe",
            "bar",
            "meal_takeaway",
            "bakery",
          ],
          languageCode: "fr",
        }),
      }
    );

    const data = await res.json();

    if (data.error) {
      logger.error("Places API error", data.error, { path: "/api/places/search" });
      return NextResponse.json(
        { error: data.error.message || "Places API error" },
        { status: 500 }
      );
    }

    const predictions = (data.suggestions || [])
      .filter((s: PlaceSuggestion) => s.placePrediction)
      .map((s: PlaceSuggestion) => {
        const p = s.placePrediction!;
        return {
          placeId: p.placeId,
          name: p.structuredFormat.mainText.text,
          address: p.structuredFormat.secondaryText.text,
          description: p.text.text,
        };
      });

    return NextResponse.json({ predictions });
  } catch (error) {
    logger.error("Places search error", error, { path: "/api/places/search" });
    return NextResponse.json(
      { error: "Failed to search places" },
      { status: 500 }
    );
  }
}
