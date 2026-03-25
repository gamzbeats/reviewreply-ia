import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { getTrendsAnalysisPrompt } from "@/lib/prompts";
import { TrendsAnalysisResponse } from "@/lib/types";
import { getOrCreateUser } from "@/lib/auth";
import { checkLimit, trackUsage } from "@/lib/usage";
import { parseBody } from "@/lib/api-helpers";
import { trendsRequestSchema } from "@/lib/validation";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimited = rateLimit(request, "trends", RATE_LIMITS.trends);
    if (rateLimited) return rateLimited;

    const parsed = await parseBody(request, trendsRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { reviews, locale } = parsed.data;

    // Check plan limits
    let userId: string | null = null;
    try {
      const user = await getOrCreateUser();
      userId = user.id;
      const { allowed, used, limit } = await checkLimit(
        user.id,
        user.plan,
        "TRENDS_ANALYSIS"
      );
      if (!allowed) {
        return NextResponse.json(
          { error: "PLAN_LIMIT", used, limit },
          { status: 403 }
        );
      }
    } catch {
      // Allow unauthenticated for landing demo
    }

    const formattedReviews = reviews
      .map((r: string, i: number) => `[Review ${i + 1}]: "${r}"`)
      .join("\n\n");

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: getTrendsAnalysisPrompt(locale || "fr") },
        {
          role: "user",
          content: `Here are ${reviews.length} customer reviews to analyze:\n\n${formattedReviews}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 2000,
    });

    const raw = completion.choices[0].message.content || "{}";
    const aiResult = JSON.parse(raw);

    const negativeCount = aiResult.issues?.reduce(
      (max: number, issue: { count: number }) =>
        Math.max(max, issue.count),
      0
    );

    const result: TrendsAnalysisResponse = {
      issues: aiResult.issues || [],
      suggestions: aiResult.suggestions || [],
      summary: aiResult.summary || "",
      totalReviews: reviews.length,
      negativeCount: negativeCount || 0,
    };

    // Track usage
    if (userId) {
      await trackUsage(userId, "TRENDS_ANALYSIS").catch(() => {});
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Trends analysis error", error, { path: "/api/trends" });
    return NextResponse.json(
      { error: "Failed to analyze trends" },
      { status: 500 }
    );
  }
}
