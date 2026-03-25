"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StarRating from "@/components/ui/StarRating";
import Spinner from "@/components/ui/Spinner";
import { Review, ReviewSource, Rating, AnalyzeResponse } from "@/lib/types";

interface ReviewInputFormProps {
  onReviewAdded: (review: Review) => void;
  restaurantId?: string | null;
}

export default function ReviewInputForm({ onReviewAdded, restaurantId }: ReviewInputFormProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  const [author, setAuthor] = useState("");
  const [source, setSource] = useState<ReviewSource>("google");
  const [rating, setRating] = useState<Rating>(3);
  const [content, setContent] = useState("");
  const [tone, setTone] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, rating, author, locale, source, restaurantId, tone: tone || undefined }),
      });

      if (!res.ok) throw new Error("Failed to analyze review");

      const data: AnalyzeResponse & { reviewId?: string; responseId?: string } = await res.json();

      const review: Review = {
        id: data.reviewId || crypto.randomUUID(),
        author: author || (locale === "fr" ? "Anonyme" : "Anonymous"),
        source,
        rating,
        content,
        sentiment: data.sentiment,
        sentimentScore: data.sentimentScore,
        createdAt: new Date().toISOString(),
        response: {
          id: data.responseId || crypto.randomUUID(),
          reviewId: data.reviewId || "",
          content: data.response,
          generatedAt: new Date().toISOString(),
          copied: false,
        },
      };

      onReviewAdded(review);

      setAuthor("");
      setContent("");
      setRating(3);
    } catch {
      setError(locale === "fr" ? "Erreur lors de l'analyse. Veuillez réessayer." : "Error during analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold mb-6">{t("addReview")}</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">{t("form.author")}</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={t("form.authorPlaceholder")}
              className="w-full px-4 py-3 bg-background rounded-[var(--radius-button)] border border-border text-[var(--text-body-lg)] outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t("form.source")}</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as ReviewSource)}
              className="w-full px-4 py-3 bg-background rounded-[var(--radius-button)] border border-border text-[var(--text-body-lg)] outline-none focus:border-foreground transition-colors"
            >
              <option value="google">{t("sources.google")}</option>
              <option value="tripadvisor">{t("sources.tripadvisor")}</option>
              <option value="yelp">{t("sources.yelp")}</option>
              <option value="other">{t("sources.other")}</option>
            </select>
          </div>
        </div>

        {/* Tone selector (Pro feature) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t("form.tone")}
            <span className="ml-2 text-xs text-muted font-normal">Pro</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {["", "professional", "warm", "casual", "formal"].map((t_val) => (
              <button
                key={t_val}
                type="button"
                onClick={() => setTone(t_val)}
                className={`px-3 py-1.5 text-sm rounded-[var(--radius-button)] border transition-colors ${
                  tone === t_val
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {t_val === "" ? t("form.toneDefault") : t(`form.tones.${t_val}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("form.rating")}</label>
          <StarRating value={rating} onChange={(v) => setRating(v as Rating)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("form.content")}</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("form.contentPlaceholder")}
            rows={4}
            required
            className="w-full px-4 py-3 bg-background rounded-[var(--radius-button)] border border-border text-[var(--text-body-lg)] outline-none focus:border-foreground transition-colors resize-none"
          />
        </div>

        {error && (
          <p className="text-sentiment-negative text-sm">{error}</p>
        )}

        <Button type="submit" size="lg" disabled={loading || !content.trim()} className="w-full">
          {loading ? (
            <span className="flex items-center gap-3">
              <Spinner size="sm" />
              {t("form.submitting")}
            </span>
          ) : (
            t("form.submit")
          )}
        </Button>
      </form>
    </Card>
  );
}
