"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import StarRating from "@/components/ui/StarRating";
import CopyButton from "@/components/ui/CopyButton";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { Review, AnalyzeResponse } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface ReviewCardProps {
  review: Review;
  onUpdate: (review: Review) => void;
  onDelete: (id: string) => void;
}

export default function ReviewCard({ review, onUpdate, onDelete }: ReviewCardProps) {
  const t = useTranslations("dashboard.review");
  const tSources = useTranslations("dashboard.sources");
  const locale = useLocale();
  const [regenerating, setRegenerating] = useState(false);

  const sentimentLabel = t(review.sentiment);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: review.content,
          rating: review.rating,
          author: review.author,
          locale,
          regenerate: true,
          reviewId: review.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to regenerate");

      const data: AnalyzeResponse = await res.json();
      const updatedReview: Review = {
        ...review,
        response: {
          id: crypto.randomUUID(),
          reviewId: review.id,
          content: data.response,
          generatedAt: new Date().toISOString(),
          copied: false,
        },
      };
      onUpdate(updatedReview);
    } catch {
      // silently fail
    } finally {
      setRegenerating(false);
    }
  };

  const handleDelete = () => {
    onDelete(review.id);
  };

  return (
    <Card className="space-y-4">
      {/* Review header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold">{review.author}</span>
          <Badge sentiment={review.sentiment} label={sentimentLabel} />
          <span className="text-sm text-muted">
            {tSources(review.source)}
          </span>
        </div>
        <span className="text-sm text-muted whitespace-nowrap">
          {formatDate(review.createdAt, locale)}
        </span>
      </div>

      {/* Rating */}
      <StarRating value={review.rating} readonly size="sm" />

      {/* Review content */}
      <p className="text-foreground/80 leading-relaxed">{review.content}</p>

      {/* Generated response */}
      {review.response && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wide">
            {t("response")}
          </h4>
          <div className="bg-background rounded-[var(--radius-button)] p-4">
            <p className="leading-relaxed">{review.response.content}</p>
          </div>

          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <CopyButton
              text={review.response.content}
              label={t("copy")}
              copiedLabel={t("copied")}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              disabled={regenerating}
            >
              {regenerating ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  {t("regenerating")}
                </span>
              ) : (
                t("regenerate")
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-sentiment-negative hover:text-sentiment-negative ml-auto"
            >
              {t("delete")}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
