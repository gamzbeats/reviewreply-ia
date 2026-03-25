import { z } from "zod";

// === Analyze ===
export const analyzeRequestSchema = z.object({
  content: z.string().min(1, "Content is required").max(2000, "Content too long (max 2000)"),
  rating: z.number().int().min(1).max(5),
  author: z.string().max(100).optional().default(""),
  locale: z.enum(["fr", "en"]).optional().default("fr"),
  source: z.enum(["google", "tripadvisor", "yelp", "other"]).optional().default("google"),
  restaurantId: z.string().optional(),
  regenerate: z.boolean().optional().default(false),
  reviewId: z.string().optional(),
  tone: z.enum(["professional", "warm", "casual", "formal"]).optional(),
});

export type AnalyzeRequestInput = z.infer<typeof analyzeRequestSchema>;

// === Restaurant Create ===
export const restaurantCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  address: z.string().max(500).optional(),
  googlePlaceId: z.string().optional(),
  googleRating: z.number().min(0).max(5).optional(),
  googleReviewCount: z.number().int().min(0).optional(),
});

export type RestaurantCreateInput = z.infer<typeof restaurantCreateSchema>;

// === Restaurant Update ===
export const restaurantUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().max(500).nullable().optional(),
  syncEnabled: z.boolean().optional(),
});

export type RestaurantUpdateInput = z.infer<typeof restaurantUpdateSchema>;

// === Delete Review ===
export const deleteReviewSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
});

export type DeleteReviewInput = z.infer<typeof deleteReviewSchema>;

// === Trends ===
export const trendsRequestSchema = z.object({
  reviews: z.array(z.string().min(1)).min(1, "At least 1 review required").max(200, "Max 200 reviews"),
  locale: z.enum(["fr", "en"]).optional().default("fr"),
});

export type TrendsRequestInput = z.infer<typeof trendsRequestSchema>;

// === Billing Checkout ===
export const checkoutRequestSchema = z.object({
  priceId: z.string().min(1, "Price ID is required").startsWith("price_", "Invalid price ID"),
});

export type CheckoutRequestInput = z.infer<typeof checkoutRequestSchema>;
