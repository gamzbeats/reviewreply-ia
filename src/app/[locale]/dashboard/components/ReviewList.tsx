"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Review, Sentiment, ReviewSource } from "@/lib/types";
import ReviewCard from "./ReviewCard";
import Tabs from "@/components/ui/Tabs";
import Pagination from "@/components/ui/Pagination";

interface Filters {
  sentiment: string;
  source: string;
  sort: string;
  search: string;
  page: number;
}

interface Template {
  id: string;
  name: string;
  content: string;
  sentiment: string;
}

interface ReviewListProps {
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onUpdate: (review: Review) => void;
  onDelete: (id: string) => void;
  templates?: Template[];
}

const ITEMS_PER_PAGE = 20;

export default function ReviewList({
  reviews,
  total,
  page,
  totalPages,
  filters,
  onFiltersChange,
  onUpdate,
  onDelete,
  templates,
}: ReviewListProps) {
  const t = useTranslations("dashboard");
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput, page: 1 });
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const sentimentTabs = [
    { value: "", label: t("filters.all") },
    { value: "positive", label: t("review.positive") },
    { value: "neutral", label: t("review.neutral") },
    { value: "negative", label: t("review.negative") },
  ];

  const sources: { value: string; label: string }[] = [
    { value: "", label: t("filters.allSources") },
    { value: "google", label: t("sources.google") },
    { value: "tripadvisor", label: t("sources.tripadvisor") },
    { value: "yelp", label: t("sources.yelp") },
    { value: "other", label: t("sources.other") },
  ];

  const sortOptions: { value: string; label: string }[] = [
    { value: "createdAt_desc", label: t("filters.sortNewest") },
    { value: "createdAt_asc", label: t("filters.sortOldest") },
    { value: "rating_desc", label: t("filters.sortHighest") },
    { value: "rating_asc", label: t("filters.sortLowest") },
  ];

  const from = (page - 1) * ITEMS_PER_PAGE + 1;
  const to = Math.min(page * ITEMS_PER_PAGE, total);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="space-y-3">
        {/* Sentiment tabs */}
        <Tabs
          tabs={sentimentTabs}
          activeTab={filters.sentiment}
          onTabChange={(value) =>
            onFiltersChange({ ...filters, sentiment: value, page: 1 })
          }
        />

        {/* Search, source, sort row */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("filters.searchPlaceholder")}
              className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-[var(--radius-button)] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Source dropdown */}
          <select
            value={filters.source}
            onChange={(e) =>
              onFiltersChange({ ...filters, source: e.target.value, page: 1 })
            }
            className="px-3 py-2 text-sm bg-card border border-border rounded-[var(--radius-button)] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {sources.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Sort dropdown */}
          <select
            value={filters.sort}
            onChange={(e) =>
              onFiltersChange({ ...filters, sort: e.target.value, page: 1 })
            }
            className="px-3 py-2 text-sm bg-card border border-border rounded-[var(--radius-button)] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {sortOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results info */}
      {total > 0 && (
        <p className="text-sm text-muted">
          {t("pagination.showing", { from, to, total })}
        </p>
      )}

      {/* Review cards */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onUpdate={onUpdate}
              onDelete={onDelete}
              templates={templates}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted">
          <p>{t("filters.search")} — 0 results</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => onFiltersChange({ ...filters, page: p })}
        />
      )}
    </div>
  );
}
