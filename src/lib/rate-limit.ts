import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const staleThreshold = now - 10 * 60 * 1000; // 10 min
  for (const [key, entry] of store) {
    if (entry.lastRefill < staleThreshold) {
      store.delete(key);
    }
  }
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  analyze: { maxRequests: 20, windowMs: 60_000 },
  analyzePublic: { maxRequests: 5, windowMs: 60_000 },
  trends: { maxRequests: 5, windowMs: 60_000 },
  places: { maxRequests: 30, windowMs: 60_000 },
  general: { maxRequests: 100, windowMs: 60_000 },
} as const;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; resetMs: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { tokens: config.maxRequests - 1, lastRefill: now });
    return { success: true, remaining: config.maxRequests - 1, resetMs: config.windowMs };
  }

  // Refill tokens based on elapsed time
  const elapsed = now - entry.lastRefill;
  const refillRate = config.maxRequests / config.windowMs;
  const newTokens = Math.min(
    config.maxRequests,
    entry.tokens + elapsed * refillRate
  );

  entry.lastRefill = now;

  if (newTokens < 1) {
    entry.tokens = newTokens;
    const waitMs = Math.ceil((1 - newTokens) / refillRate);
    return { success: false, remaining: 0, resetMs: waitMs };
  }

  entry.tokens = newTokens - 1;
  return { success: true, remaining: Math.floor(entry.tokens), resetMs: config.windowMs };
}

export function rateLimit(
  request: NextRequest,
  prefix: string,
  config: RateLimitConfig
): NextResponse | null {
  const ip = getClientIp(request);
  const key = `${prefix}:${ip}`;
  const result = checkRateLimit(key, config);

  if (!result.success) {
    return NextResponse.json(
      { error: "TOO_MANY_REQUESTS", retryAfter: Math.ceil(result.resetMs / 1000) },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(result.resetMs / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}
