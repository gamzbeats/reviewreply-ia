import { prisma } from "./db";

interface SerpApiReview {
  snippet?: string;
  extracted_snippet?: { original?: string };
  rating?: number;
  user?: { name?: string };
  date?: string;
  iso_date?: string;
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
  };
  error?: string;
}

const MAX_PAGES = 15;
const MAX_REVIEWS = 150;

export async function syncGoogleReviews(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant?.googlePlaceId) {
    throw new Error("Restaurant has no Google Place ID");
  }

  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("SerpAPI key not configured");
  }

  const rawReviews: SerpApiReview[] = [];
  let nextPageToken: string | null = null;

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      engine: "google_maps_reviews",
      place_id: restaurant.googlePlaceId,
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
      if (page === 0) throw new Error(data.error);
      break;
    }

    // Update restaurant info from first page
    if (page === 0 && data.place_info) {
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          googleRating: data.place_info.rating || undefined,
          googleReviewCount: data.place_info.reviews || undefined,
          address: data.place_info.address || undefined,
        },
      });
    }

    if (data.reviews && data.reviews.length > 0) {
      rawReviews.push(...data.reviews);
    }

    if (
      rawReviews.length >= MAX_REVIEWS ||
      !data.serpapi_pagination?.next_page_token
    ) {
      break;
    }

    nextPageToken = data.serpapi_pagination.next_page_token;
  }

  // Deduplicate: create a unique ID from author+content hash
  let inserted = 0;
  let skipped = 0;

  for (const review of rawReviews) {
    const text =
      review.snippet || review.extracted_snippet?.original || "";
    if (text.length <= 10) continue;

    const author = review.user?.name || "Anonyme";
    // Create a simple unique ID from content hash
    const googleReviewId = simpleHash(`${author}:${text.slice(0, 100)}`);

    // Check if already exists
    const existing = await prisma.review.findUnique({
      where: { googleReviewId },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.review.create({
      data: {
        author,
        source: "GOOGLE",
        rating: review.rating || 3,
        content: text,
        googleReviewId,
        reviewDate: review.iso_date ? new Date(review.iso_date) : null,
        restaurantId,
      },
    });

    inserted++;
  }

  // Update lastSyncAt
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { lastSyncAt: new Date() },
  });

  return { inserted, skipped, total: rawReviews.length };
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `grev_${Math.abs(hash).toString(36)}`;
}
