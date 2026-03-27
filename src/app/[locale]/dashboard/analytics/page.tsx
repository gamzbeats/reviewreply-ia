"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Skeleton, { SkeletonStat, SkeletonChart } from "@/components/ui/Skeleton";
import { Link } from "@/i18n/navigation";
import RestaurantSwitcher from "@/app/[locale]/dashboard/components/RestaurantSwitcher";

interface WeeklyData {
  week: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  avgRating: number;
  responseRate: number;
}

interface AnalyticsData {
  sentimentOverTime: WeeklyData[];
  ratingDistribution: { rating: number; count: number }[];
  responseRate: number;
  totalReviews: number;
}

const PERIOD_OPTIONS = [
  { value: 28, labelKey: "last4Weeks" },
  { value: 84, labelKey: "last12Weeks" },
  { value: 180, labelKey: "last6Months" },
  { value: 365, labelKey: "last1Year" },
] as const;

export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [days, setDays] = useState(84);

  const fetchAnalytics = useCallback(async (restId: string, d: number) => {
    const res = await fetch(`/api/restaurants/${restId}/analytics?days=${d}`);
    if (res.ok) {
      const json = await res.json();
      setData(json);
    }
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((me) => {
        if (me.restaurantId) {
          setRestaurantId(me.restaurantId);
          return fetchAnalytics(me.restaurantId, days);
        }
        throw new Error("No restaurant");
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePeriodChange = (newDays: number) => {
    setDays(newDays);
    if (restaurantId) {
      fetchAnalytics(restaurantId, newDays);
    }
  };

  const handleSwitch = (id: string) => {
    setRestaurantId(id);
    fetchAnalytics(id, days);
  };

  if (!loaded) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
        <SkeletonChart />
        <SkeletonChart />
      </div>
    );
  }

  if (!data || data.totalReviews === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-full bg-sentiment-neutral-bg flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sentiment-neutral">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">{t("title")}</h1>
        <p className="text-muted max-w-sm mx-auto leading-relaxed mb-8">{t("noData")}</p>
        <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 bg-brand text-[#111111] px-6 py-3 rounded-[var(--radius-button)] font-medium hover:bg-brand-hover transition-colors text-sm">
          {t("noDataCta")}
        </Link>
      </div>
    );
  }

  // Merge neutral into positive for display
  const chartData = data.sentimentOverTime.map((w) => ({
    ...w,
    positive: w.positive + w.neutral,
  }));

  return (
    <div className="space-y-8">
      <RestaurantSwitcher activeId={restaurantId} onSwitch={handleSwitch} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted text-sm mt-1">{t("subtitle")}</p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 bg-background rounded-[var(--radius-button)] p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handlePeriodChange(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-[var(--radius-button)] transition-colors ${
                days === opt.value
                  ? "bg-card font-medium text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-[var(--radius-card)] p-4">
          <p className="text-xs text-muted uppercase">{t("totalReviews")}</p>
          <p className="text-2xl font-bold mt-1">{data.totalReviews}</p>
        </div>
        <div className="bg-card border border-border rounded-[var(--radius-card)] p-4">
          <p className="text-xs text-muted uppercase">{t("responseRate")}</p>
          <p className="text-2xl font-bold mt-1">{data.responseRate}%</p>
        </div>
      </div>

      {/* Sentiment over time */}
      <div className="bg-card border border-border rounded-[var(--radius-card)] p-5">
        <h2 className="font-semibold mb-4">{t("sentimentOverTime")}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="positive"
              stroke="var(--sentiment-positive)"
              name={t("positive")}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="negative"
              stroke="var(--sentiment-negative)"
              name={t("negative")}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Rating distribution */}
      <div className="bg-card border border-border rounded-[var(--radius-card)] p-5">
        <h2 className="font-semibold mb-4">{t("ratingDistribution")}</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.ratingDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="rating"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${v}★`}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Volume + response rate over time */}
      <div className="bg-card border border-border rounded-[var(--radius-card)] p-5">
        <h2 className="font-semibold mb-4">{t("volumeOverTime")}</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.sentimentOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="total"
              fill="var(--primary)"
              name={t("reviewVolume")}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
