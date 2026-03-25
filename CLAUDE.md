# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ReviewReply AI — SaaS tool that helps restaurant owners respond to customer reviews using AI. Analyzes sentiment and generates professional, empathetic responses.

## Commands

- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — ESLint
- `npx prisma generate` — Generate Prisma client after schema changes
- `npx prisma migrate dev` — Run database migrations

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/postcss`)
- **i18n:** next-intl v4 — bilingual FR/EN, routing via `/[locale]/...`
- **AI:** OpenAI API (gpt-4o-mini) — sentiment analysis + response generation
- **Auth:** Clerk v7 — user authentication, middleware protection
- **Database:** Supabase PostgreSQL + Prisma 7 (via `@prisma/adapter-pg`)
- **External APIs:** Google Places API (New) + SerpAPI (Google reviews scraping)

## Architecture

```
src/
  app/
    [locale]/layout.tsx           — Root layout: NextIntlClientProvider + ClerkProvider
    [locale]/page.tsx             — Landing page (marketing)
    [locale]/(auth)/sign-in/      — Clerk sign-in page
    [locale]/(auth)/sign-up/      — Clerk sign-up page
    [locale]/dashboard/           — Dashboard app (review management)
    [locale]/dashboard/trends/    — Trends analysis (Google auto + manual import)
    api/analyze/route.ts          — POST: OpenAI sentiment + response generation + DB persistence
    api/trends/route.ts           — POST: Batch trends analysis
    api/me/route.ts               — GET: Current user info + active restaurant
    api/places/search/route.ts    — GET: Google Places autocomplete
    api/places/reviews/route.ts   — GET: SerpAPI Google reviews scraping
    api/restaurants/[id]/reviews/ — GET/DELETE: Restaurant reviews CRUD
    api/webhooks/clerk/route.ts   — POST: Clerk webhook (user sync)
  components/
    marketing/                    — Landing page sections
    ui/                           — Shared components (Button, Card, Badge, etc.)
    providers/ClerkProviderWrapper.tsx — Locale-aware Clerk provider
  i18n/
    routing.ts, navigation.ts, request.ts
  lib/
    db.ts                         — Prisma client singleton (PrismaPg adapter)
    auth.ts                       — Auth helpers (getCurrentUser, getOrCreateUser, requireAuth)
    types.ts                      — TypeScript interfaces
    prompts.ts                    — OpenAI system prompts
    openai.ts                     — Lazy OpenAI client
    utils.ts                      — cn(), formatDate()
  generated/prisma/               — Prisma generated client (do not edit)
  middleware.ts                   — Clerk auth + next-intl locale routing
prisma/
  schema.prisma                   — Database schema
  prisma.config.ts                — Prisma config (datasource URL)
messages/
  fr.json, en.json                — Translation files
```

## Key Patterns

- **i18n navigation:** Always import `Link`, `useRouter`, `usePathname` from `@/i18n/navigation`, NOT from `next/navigation` or `next-intl` directly.
- **Translations:** Use `useTranslations("namespace")` in components. Arrays (like pricing features) use `t.raw("key")`.
- **OpenAI client:** Use `getOpenAI()` (lazy init) instead of importing a singleton — avoids build errors when `OPENAI_API_KEY` is missing.
- **Prisma client:** Import from `@/lib/db`. Prisma 7 uses adapter pattern — `@prisma/adapter-pg` with connection string from `DATABASE_URL`.
- **Prisma types:** Import from `@/generated/prisma/client` (no index.ts — always use `/client`).
- **Auth:** Use `getOrCreateUser()` from `@/lib/auth` in API routes. Auto-creates user + default restaurant on first access.
- **Middleware:** Composed Clerk + next-intl. Clerk runs first (auth check), then next-intl (locale routing). Dashboard routes are protected.
- **Clerk v7:** No `SignedIn`/`SignedOut` components. Use `useAuth()` hook with `isSignedIn` boolean instead.
- **Design tokens:** Defined in `src/app/globals.css` via `@theme` block (Tailwind v4 syntax).
- **API route:** `POST /api/analyze` accepts `{ content, rating, author, locale, source, restaurantId, regenerate?, reviewId? }`. Returns `{ sentiment, sentimentScore, response, reviewId?, responseId? }`.

## Environment Variables

- `OPENAI_API_KEY` — Required for AI features
- `GOOGLE_PLACES_API_KEY` — Google Places API (New)
- `SERPAPI_API_KEY` — SerpAPI for Google reviews scraping
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk public key
- `CLERK_SECRET_KEY` — Clerk secret key
- `CLERK_WEBHOOK_SECRET` — Clerk webhook verification (optional in dev)
- `DATABASE_URL` — Supabase PostgreSQL connection string (pooled)
- `DIRECT_URL` — Supabase direct connection (for migrations)

See `.env.example` for template.
