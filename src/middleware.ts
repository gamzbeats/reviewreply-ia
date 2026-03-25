import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const isPublicRoute = createRouteMatcher([
  "/",
  "/:locale",
  "/:locale/sign-in(.*)",
  "/:locale/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
  "/api/analyze",
  "/api/places(.*)",
]);

const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Don't run intl middleware on API routes — they don't need locale redirects
  if (isApiRoute(req)) {
    return;
  }

  return intlMiddleware(req);
});

export const config = {
  // Include API routes so Clerk can inject auth context
  matcher: ["/((?!_next|_vercel|.*\\..*).*)", "/api/(.*)"],
};
