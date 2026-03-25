"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

interface ReviewImportFormProps {
  onAnalyze: (reviews: string[]) => void;
  loading: boolean;
}

export default function ReviewImportForm({
  onAnalyze,
  loading,
}: ReviewImportFormProps) {
  const t = useTranslations("trends");
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"bulk" | "individual">("bulk");
  const [individualReviews, setIndividualReviews] = useState<string[]>([""]);

  const handleSubmitBulk = () => {
    const reviews = text
      .split(/\n{2,}/)
      .map((r) => r.trim())
      .filter((r) => r.length > 10);

    if (reviews.length < 3) {
      const byLine = text
        .split(/\n/)
        .map((r) => r.trim())
        .filter((r) => r.length > 10);
      if (byLine.length >= 3) {
        onAnalyze(byLine);
        return;
      }
    }

    if (reviews.length >= 3) {
      onAnalyze(reviews);
    }
  };

  const handleSubmitIndividual = () => {
    const reviews = individualReviews
      .map((r) => r.trim())
      .filter((r) => r.length > 10);
    if (reviews.length >= 3) {
      onAnalyze(reviews);
    }
  };

  const addReviewField = () => {
    setIndividualReviews((prev) => [...prev, ""]);
  };

  const updateReviewField = (index: number, value: string) => {
    setIndividualReviews((prev) =>
      prev.map((r, i) => (i === index ? value : r))
    );
  };

  const removeReviewField = (index: number) => {
    setIndividualReviews((prev) => prev.filter((_, i) => i !== index));
  };

  const bulkCount = text
    .split(/\n{2,}/)
    .map((r) => r.trim())
    .filter((r) => r.length > 10).length;

  const individualCount = individualReviews.filter(
    (r) => r.trim().length > 10
  ).length;

  const currentCount = mode === "bulk" ? bulkCount : individualCount;
  const canSubmit = currentCount >= 3 && !loading;

  return (
    <Card>
      <div className="space-y-5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("bulk")}
            className={`px-4 py-2 text-sm rounded-[var(--radius-button)] transition-colors cursor-pointer ${
              mode === "bulk"
                ? "bg-foreground text-white"
                : "bg-background text-muted hover:text-foreground"
            }`}
          >
            {t("form.modeBulk")}
          </button>
          <button
            type="button"
            onClick={() => setMode("individual")}
            className={`px-4 py-2 text-sm rounded-[var(--radius-button)] transition-colors cursor-pointer ${
              mode === "individual"
                ? "bg-foreground text-white"
                : "bg-background text-muted hover:text-foreground"
            }`}
          >
            {t("form.modeIndividual")}
          </button>
        </div>

        {mode === "bulk" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("form.bulkLabel")}</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("form.bulkPlaceholder")}
              rows={12}
              className="w-full bg-background rounded-[var(--radius-button)] px-5 py-4 text-sm resize-y outline-none border border-border focus:border-foreground transition-colors"
            />
            <p className="text-xs text-muted">{t("form.bulkHint")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-sm font-medium">
              {t("form.individualLabel")}
            </label>
            {individualReviews.map((review, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-background flex items-center justify-center text-xs text-muted mt-3">
                  {index + 1}
                </div>
                <textarea
                  value={review}
                  onChange={(e) => updateReviewField(index, e.target.value)}
                  placeholder={t("form.individualPlaceholder")}
                  rows={3}
                  className="flex-1 bg-background rounded-[var(--radius-button)] px-4 py-3 text-sm resize-y outline-none border border-border focus:border-foreground transition-colors"
                />
                {individualReviews.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeReviewField(index)}
                    className="flex-shrink-0 text-muted hover:text-sentiment-negative transition-colors mt-3 cursor-pointer"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addReviewField}
              className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              + {t("form.addAnother")}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted">
            {t("form.reviewCount", { count: currentCount })}
            {currentCount < 3 && (
              <span className="text-sentiment-negative ml-2">
                ({t("form.minimum")})
              </span>
            )}
          </p>
          <Button
            onClick={mode === "bulk" ? handleSubmitBulk : handleSubmitIndividual}
            disabled={!canSubmit}
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                {t("form.analyzing")}
              </>
            ) : (
              t("form.submit")
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
