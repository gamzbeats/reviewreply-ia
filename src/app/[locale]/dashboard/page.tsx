"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Review } from "@/lib/types";
import ReviewInputForm from "./components/ReviewInputForm";
import ReviewList from "./components/ReviewList";
import EmptyState from "./components/EmptyState";
import RestaurantSwitcher from "./components/RestaurantSwitcher";

interface Stats {
  totalReviews: number;
  avgRating: number | null;
  recentReviews: number;
  responseRate: number;
  sentiment: { positive: number; neutral: number; negative: number };
  googleRating: number | null;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<
    { id: string; name: string }[]
  >([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchData = useCallback(async (restId?: string) => {
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

      // Fetch reviews and stats in parallel
      const [reviewsRes, statsRes] = await Promise.all([
        fetch(`/api/restaurants/${targetId}/reviews`),
        fetch(`/api/restaurants/${targetId}/stats`),
      ]);

      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(data.reviews || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSwitch = (id: string) => {
    setLoaded(false);
    setReviews([]);
    setStats(null);
    fetchData(id);
  };

  const handleReviewAdded = (review: Review) => {
    setReviews((prev) => [review, ...prev]);
    // Refresh stats
    if (restaurantId) {
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
    setReviews((prev) => prev.filter((r) => r.id !== id));
    if (restaurantId) {
      await fetch(`/api/restaurants/${restaurantId}/reviews`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: id }),
      }).catch(() => {});
    }
  };

  if (!loaded) return null;

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
            value={`${stats.sentiment.positive}`}
            sub={`${stats.sentiment.negative} ${t("stats.negative")}`}
            color={
              stats.sentiment.negative > stats.sentiment.positive
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
      {reviews.length > 0 ? (
        <ReviewList
          reviews={reviews}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
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
