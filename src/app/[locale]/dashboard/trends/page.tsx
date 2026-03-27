"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { TrendsAnalysisResponse } from "@/lib/types";
import RestaurantSearch from "./components/RestaurantSearch";
import ReviewImportForm from "./components/ReviewImportForm";
import TrendsResults from "./components/TrendsResults";
import Spinner from "@/components/ui/Spinner";

type Tab = "google" | "manual";
type Step = "idle" | "fetching" | "analyzing";

interface PlaceInfo {
  name: string;
  address: string;
  rating: number;
  totalReviews: number;
}

export default function TrendsPage() {
  const t = useTranslations("trends");
  const locale = useLocale();
  const [tab, setTab] = useState<Tab>("google");
  const [results, setResults] = useState<TrendsAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [fetchedCount, setFetchedCount] = useState(0);
  const [error, setError] = useState("");
  const [restaurantInfo, setRestaurantInfo] = useState<PlaceInfo | null>(null);

  const handleGoogleAnalyze = async (placeId: string, info: PlaceInfo) => {
    setLoading(true);
    setError("");
    setResults(null);
    setRestaurantInfo(info);
    setStep("fetching");
    setFetchedCount(0);

    try {
      // Step 1: Fetch reviews from Google via SerpAPI
      const reviewsRes = await fetch(
        `/api/places/reviews?place_id=${encodeURIComponent(placeId)}`
      );

      if (!reviewsRes.ok) {
        const data = await reviewsRes.json();
        throw new Error(data.error || "Failed to fetch reviews");
      }

      const reviewsData = await reviewsRes.json();
      const reviews: string[] = reviewsData.reviews || [];
      setFetchedCount(reviews.length);

      if (reviewsData.placeInfo) {
        setRestaurantInfo(reviewsData.placeInfo);
      }

      if (reviews.length < 3) {
        throw new Error(t("search.notEnoughReviews"));
      }

      // Step 2: Analyze with OpenAI
      setStep("analyzing");

      const analysisRes = await fetch("/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews, locale }),
      });

      if (!analysisRes.ok) {
        const data = await analysisRes.json();
        throw new Error(data.error || "Failed to analyze");
      }

      const data: TrendsAnalysisResponse = await analysisRes.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
      setStep("idle");
    }
  };

  const handleManualAnalyze = async (reviews: string[]) => {
    setLoading(true);
    setError("");
    setResults(null);
    setRestaurantInfo(null);
    setStep("analyzing");

    try {
      const res = await fetch("/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews, locale }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to analyze");
      }

      const data: TrendsAnalysisResponse = await res.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
      setStep("idle");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted mt-1">{t("subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setTab("google");
            setResults(null);
            setError("");
          }}
          className={`px-5 py-2.5 text-sm rounded-[var(--radius-button)] transition-colors cursor-pointer font-medium ${
            tab === "google"
              ? "bg-foreground text-background"
              : "bg-card text-muted hover:text-foreground border border-border"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t("tabs.google")}
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("manual");
            setResults(null);
            setError("");
          }}
          className={`px-5 py-2.5 text-sm rounded-[var(--radius-button)] transition-colors cursor-pointer font-medium ${
            tab === "manual"
              ? "bg-foreground text-background"
              : "bg-card text-muted hover:text-foreground border border-border"
          }`}
        >
          {t("tabs.manual")}
        </button>
      </div>

      {/* Content */}
      {tab === "google" ? (
        <RestaurantSearch
          onRestaurantSelected={handleGoogleAnalyze}
          loading={loading}
        />
      ) : (
        <ReviewImportForm onAnalyze={handleManualAnalyze} loading={loading} />
      )}

      {/* Progress indicator */}
      {step !== "idle" && (
        <div className="flex items-center gap-4 bg-card rounded-[var(--radius-button)] px-5 py-4 border border-border">
          <Spinner size="md" />
          <div>
            <p className="text-sm font-medium">
              {step === "fetching" && t("progress.fetching")}
              {step === "analyzing" && t("progress.analyzing")}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {step === "fetching" && t("progress.fetchingHint")}
              {step === "analyzing" &&
                (fetchedCount > 0
                  ? t("progress.analyzingCount", { count: fetchedCount })
                  : t("progress.analyzingHint"))}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-sentiment-negative-bg text-sentiment-negative rounded-[var(--radius-button)] px-5 py-4 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {restaurantInfo && restaurantInfo.name && (
            <div className="flex items-center gap-3 bg-card rounded-[var(--radius-button)] px-5 py-4 border border-border">
              <div className="w-10 h-10 rounded-full bg-sentiment-negative-bg flex items-center justify-center flex-shrink-0">
                <svg
                  className="text-sentiment-negative"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">{restaurantInfo.name}</p>
                <p className="text-xs text-muted">
                  {restaurantInfo.address}
                  {restaurantInfo.rating > 0 &&
                    ` — ${restaurantInfo.rating}/5 (${restaurantInfo.totalReviews} ${t("search.reviewsLabel")})`}
                </p>
              </div>
            </div>
          )}
          <TrendsResults data={results} />
        </div>
      )}
    </div>
  );
}
