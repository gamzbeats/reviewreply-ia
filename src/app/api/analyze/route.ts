import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { getAnalyzePrompt, getRegeneratePrompt } from "@/lib/prompts";
import { AnalyzeResponse } from "@/lib/types";
import { prisma } from "@/lib/db";
import { getOrCreateUser, getActiveRestaurant } from "@/lib/auth";
import { checkLimit, trackUsage } from "@/lib/usage";
import { parseBody } from "@/lib/api-helpers";
import { analyzeRequestSchema } from "@/lib/validation";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, analyzeRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { content, rating, author, locale, regenerate, reviewId, source, restaurantId, tone } =
      parsed.data;

    // Auth + usage tracking
    let user = null;
    let isAuthenticated = false;
    try {
      user = await getOrCreateUser();
      isAuthenticated = true;

      // Check plan limits
      const { allowed, used, limit } = await checkLimit(
        user.id,
        user.plan,
        regenerate ? "REGENERATE_RESPONSE" : "ANALYZE_REVIEW"
      );
      if (!allowed) {
        return NextResponse.json(
          { error: "PLAN_LIMIT", used, limit },
          { status: 403 }
        );
      }
    } catch {
      // Allow unauthenticated for now (landing page demo)
    }

    // Rate limiting (stricter for unauthenticated)
    const rlConfig = isAuthenticated ? RATE_LIMITS.analyze : RATE_LIMITS.analyzePublic;
    const rateLimited = rateLimit(request, "analyze", rlConfig);
    if (rateLimited) return rateLimited;

    const userMessage = `REVIEW:\nRating: ${rating}/5 | Author: ${author || "Anonymous"}\n"${content}"`;

    if (regenerate) {
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: getRegeneratePrompt(locale || "fr", tone) },
          { role: "user", content: userMessage },
        ],
        temperature: 0.9,
        max_tokens: 300,
      });

      const responseText = completion.choices[0].message.content || "";

      // Save regenerated response to DB
      if (user && reviewId) {
        await prisma.generatedResponse.create({
          data: {
            content: responseText,
            reviewId,
          },
        });

        // Track usage
        await trackUsage(user.id, "REGENERATE_RESPONSE").catch(() => {});
      }

      return NextResponse.json({
        sentiment: "neutral",
        sentimentScore: 0.5,
        response: responseText,
      } satisfies AnalyzeResponse);
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: getAnalyzePrompt(locale || "fr", tone) },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 300,
    });

    const raw = completion.choices[0].message.content || "{}";
    const aiResult = JSON.parse(raw);

    const result: AnalyzeResponse = {
      sentiment: aiResult.sentiment || "neutral",
      sentimentScore: aiResult.sentimentScore || 0.5,
      response: aiResult.response || "",
    };

    // Save review + response to DB
    if (user) {
      let targetRestaurantId = restaurantId;
      if (!targetRestaurantId) {
        const restaurant = await getActiveRestaurant(user.id);
        targetRestaurantId = restaurant?.id;
      }

      if (targetRestaurantId) {
        const sentimentMap: Record<string, "POSITIVE" | "NEUTRAL" | "NEGATIVE"> = {
          positive: "POSITIVE",
          neutral: "NEUTRAL",
          negative: "NEGATIVE",
        };

        const sourceMap: Record<string, "GOOGLE" | "TRIPADVISOR" | "YELP" | "OTHER"> = {
          google: "GOOGLE",
          tripadvisor: "TRIPADVISOR",
          yelp: "YELP",
          other: "OTHER",
        };

        const review = await prisma.review.create({
          data: {
            author: author || "Anonyme",
            source: sourceMap[source || "google"] || "OTHER",
            rating,
            content,
            sentiment: sentimentMap[result.sentiment] || "NEUTRAL",
            sentimentScore: result.sentimentScore,
            restaurantId: targetRestaurantId,
            responses: {
              create: {
                content: result.response,
              },
            },
          },
          include: { responses: true },
        });

        // Track usage
        await trackUsage(user.id, "ANALYZE_REVIEW").catch(() => {});

        // Return with DB IDs
        return NextResponse.json({
          ...result,
          reviewId: review.id,
          responseId: review.responses[0]?.id,
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Analyze error", error, { path: "/api/analyze" });
    return NextResponse.json(
      { error: "Failed to analyze review" },
      { status: 500 }
    );
  }
}
