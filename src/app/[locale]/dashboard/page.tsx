"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Review } from "@/lib/types";
import ReviewInputForm from "./components/ReviewInputForm";
import ReviewList from "./components/ReviewList";
import EmptyState from "./components/EmptyState";
import RestaurantSwitcher from "./components/RestaurantSwitcher";
import { SkeletonStat, SkeletonReview } from "@/components/ui/Skeleton";

interface Stats {
  totalReviews: number;
  avgRating: number | null;
  recentReviews: number;
  responseRate: number;
  sentiment: { positive: number; neutral: number; negative: number };
  googleRating: number | null;
}

interface Filters {
  sentiment: string;
  source: string;
  sort: string;
  search: string;
  page: number;
}

const defaultFilters: Filters = {
  sentiment: "",
  source: "",
  sort: "createdAt_desc",
  search: "",
  page: 1,
};

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<
    { id: string; name: string }[]
  >([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [templates, setTemplates] = useState<{ id: string; name: string; content: string; sentiment: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const fetchReviews = useCallback(
    async (restId: string, f: Filters) => {
      const params = new URLSearchParams();
      params.set("page", String(f.page));
      if (f.sentiment) params.set("sentiment", f.sentiment);
      if (f.source) params.set("source", f.source);
      if (f.sort) params.set("sort", f.sort);
      if (f.search) params.set("search", f.search);

      const res = await fetch(
        `/api/restaurants/${restId}/reviews?${params.toString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    },
    []
  );

  const fetchData = useCallback(
    async (restId?: string) => {
      try {
        const meRes = await fetch("/api/me");
        if (!meRes.ok) {
          setLoaded(true);
          return;
        }
        const meData = await meRes.json();
        const targetId = restId || meData.restaurantId;
        setRestaurants(meData.restaurants || []);

        if (!targetId) {
          setLoaded(true);
          return;
        }
        setRestaurantId(targetId);

        // Fetch reviews, stats, and templates in parallel
        const [, statsRes, templatesRes] = await Promise.all([
          fetchReviews(targetId, defaultFilters),
          fetch(`/api/restaurants/${targetId}/stats`),
          fetch(`/api/restaurants/${targetId}/templates`),
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }

        if (templatesRes.ok) {
          const data = await templatesRes.json();
          setTemplates(data.templates || []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoaded(true);
      }
    },
    [fetchReviews]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
    if (restaurantId) {
      fetchReviews(restaurantId, newFilters);
    }
  };

  const handleSwitch = (id: string) => {
    setLoaded(false);
    setReviews([]);
    setStats(null);
    setFilters(defaultFilters);
    fetchData(id);
  };

  const handleReviewAdded = (review: Review) => {
    // Refresh the current filtered view + stats
    if (restaurantId) {
      fetchReviews(restaurantId, filters);
      fetch(`/api/restaurants/${restaurantId}/stats`)
        .then((res) => res.json())
        .then(setStats)
        .catch(() => {});
    }
  };

  const handleUpdate = (updated: Review) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  const handleDelete = async (id: string) => {
    if (restaurantId) {
      await fetch(`/api/restaurants/${restaurantId}/reviews`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: id }),
      }).catch(() => {});
      // Refresh after delete
      fetchReviews(restaurantId, filters);
      fetch(`/api/restaurants/${restaurantId}/stats`)
        .then((res) => res.json())
        .then(setStats)
        .catch(() => {});
    }
  };

  if (!loaded) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
        <div className="space-y-4">
          <SkeletonReview />
          <SkeletonReview />
          <SkeletonReview />
        </div>
      </div>
    );
  }

  const hasAnyReviews = stats ? stats.totalReviews > 0 : reviews.length > 0;

  return (
    <div className="space-y-6">
      {/* Restaurant switcher if multiple */}
      {restaurants.length > 1 && (
        <RestaurantSwitcher activeId={restaurantId} onSwitch={handleSwitch} />
      )}

      {/* Stats cards */}
      {stats && stats.totalReviews > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label={t("stats.totalReviews")}
            value={String(stats.totalReviews)}
          />
          <StatCard
            label={t("stats.avgRating")}
            value={stats.avgRating ? `${stats.avgRating}/5` : "—"}
            sub={
              stats.googleRating
                ? `Google: ${stats.googleRating.toFixed(1)}`
                : undefined
            }
          />
          <StatCard
            label={t("stats.responseRate")}
            value={`${stats.responseRate}%`}
          />
          <StatCard
            label={t("stats.sentiment")}
            value={`${stats.sentiment.positive + (stats.sentiment.neutral ?? 0)}`}
            sub={`${stats.sentiment.negative} ${t("stats.negative")}`}
            color={
              stats.sentiment.negative > stats.sentiment.positive + (stats.sentiment.neutral ?? 0)
                ? "negative"
                : "positive"
            }
          />
        </div>
      )}

      <ReviewInputForm
        onReviewAdded={handleReviewAdded}
        restaurantId={restaurantId}
      />
      {hasAnyReviews ? (
        <ReviewList
          reviews={reviews}
          total={total}
          page={filters.page}
          totalPages={totalPages}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          templates={templates}
          restaurantId={restaurantId}
        />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: "positive" | "negative";
}) {
  return (
    <div className="bg-card border border-border rounded-[var(--radius-card)] p-4">
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && (
        <p
          className={`text-xs mt-0.5 ${
            color === "negative"
              ? "text-[var(--sentiment-negative)]"
              : color === "positive"
                ? "text-[var(--sentiment-positive)]"
                : "text-muted"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
