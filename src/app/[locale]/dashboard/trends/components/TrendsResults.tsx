"use client";

import { useTranslations } from "next-intl";
import { TrendsAnalysisResponse } from "@/lib/types";
import Card from "@/components/ui/Card";

interface TrendsResultsProps {
  data: TrendsAnalysisResponse;
}

function SeverityBadge({ level }: { level: "high" | "medium" | "low" }) {
  const colors = {
    high: "bg-sentiment-negative-bg text-sentiment-negative",
    medium: "bg-sentiment-neutral-bg text-sentiment-neutral",
    low: "bg-sentiment-positive-bg text-sentiment-positive",
  };

  const t = useTranslations("trends.severity");

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[level]}`}
    >
      {t(level)}
    </span>
  );
}

function PriorityBadge({ level }: { level: "high" | "medium" | "low" }) {
  const colors = {
    high: "bg-sentiment-negative-bg text-sentiment-negative",
    medium: "bg-sentiment-neutral-bg text-sentiment-neutral",
    low: "bg-sentiment-positive-bg text-sentiment-positive",
  };

  const t = useTranslations("trends.priority");

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[level]}`}
    >
      {t(level)}
    </span>
  );
}

function BarChart({ count, max }: { count: number; max: number }) {
  const percentage = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex-1 h-3 bg-background rounded-full overflow-hidden">
        <div
          className="h-full bg-sentiment-negative rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-muted w-8 text-right">
        {count}
      </span>
    </div>
  );
}

export default function TrendsResults({ data }: TrendsResultsProps) {
  const t = useTranslations("trends");

  const maxCount = Math.max(...data.issues.map((i) => i.count), 1);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border border-border">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-sentiment-neutral-bg flex items-center justify-center flex-shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-sentiment-neutral"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-sm">{t("results.summary")}</h3>
            <p className="text-muted text-sm mt-1 leading-relaxed">
              {data.summary}
            </p>
            <p className="text-xs text-muted mt-3">
              {t("results.reviewsAnalyzed", { count: data.totalReviews })}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues */}
        {data.issues.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              {t("results.issuesTitle")}
            </h2>
            <div className="space-y-3">
              {data.issues
                .sort((a, b) => b.count - a.count)
                .map((issue, index) => (
                  <Card key={index} padding="sm" className="border border-border">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <h3 className="font-medium text-sm truncate">
                            {issue.theme}
                          </h3>
                          <SeverityBadge level={issue.severity} />
                        </div>
                        <span className="text-sm text-muted flex-shrink-0">
                          {t("results.mentions", { count: issue.count })}
                        </span>
                      </div>

                      <BarChart count={issue.count} max={maxCount} />

                      {issue.examples.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {issue.examples.map((example, i) => (
                            <p
                              key={i}
                              className="text-xs text-muted italic pl-3 border-l-2 border-border"
                            >
                              &ldquo;{example}&rdquo;
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {data.suggestions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              {t("results.suggestionsTitle")}
            </h2>
            <div className="space-y-3">
              {data.suggestions
                .sort((a, b) => {
                  const order = { high: 0, medium: 1, low: 2 };
                  return order[a.priority] - order[b.priority];
                })
                .map((suggestion, index) => (
                  <Card key={index} padding="sm" className="border border-border">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-sentiment-positive-bg flex items-center justify-center flex-shrink-0">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-sentiment-positive"
                          >
                            <path d="M12 2v20M2 12h20" />
                          </svg>
                        </div>
                        <h3 className="font-medium text-sm flex-1">
                          {suggestion.title}
                        </h3>
                        <PriorityBadge level={suggestion.priority} />
                      </div>
                      <p className="text-sm text-muted leading-relaxed pl-10">
                        {suggestion.description}
                      </p>
                      {suggestion.relatedThemes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pl-10 pt-1">
                          {suggestion.relatedThemes.map((theme, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-background text-muted"
                            >
                              {theme}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
