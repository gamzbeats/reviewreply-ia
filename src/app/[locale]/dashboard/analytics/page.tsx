"use client";

import { useState, useEffect } from "react";
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

export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((me) => {
        if (me.restaurantId) {
          setRestaurantId(me.restaurantId);
          return fetch(`/api/restaurants/${me.restaurantId}/analytics`);
        }
        throw new Error("No restaurant");
      })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  if (!data || data.totalReviews === 0) {
    return (
      <div className="text-center py-16 text-muted">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t("title")}
        </h1>
        <p>{t("noData")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted text-sm mt-1">{t("subtitle")}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-[var(--radius-card)] p-4">
          <p className="text-xs text-muted uppercase">{t("totalReviews")}</p>
          <p className="text-2xl font-bold mt-1">{data.totalReviews}</p>
        </div>
        <div className="bg-card border border-border rounded-[var(--radius-card)] p-4">
          <p className="text-xs text-muted uppercase">{t("responseRate")}</p>
          <p className="text-2xl font-bold mt-1">{data.responseRate}%</p>
        </div>
        <div className="bg-card border border-border rounded-[var(--radius-card)] p-4">
          <p className="text-xs text-muted uppercase">{t("period")}</p>
          <p className="text-2xl font-bold mt-1">{t("last12Weeks")}</p>
        </div>
      </div>

      {/* Sentiment over time */}
      <div className="bg-card border border-border rounded-[var(--radius-card)] p-5">
        <h2 className="font-semibold mb-4">{t("sentimentOverTime")}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.sentimentOverTime}>
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
            <Line
              type="monotone"
              dataKey="neutral"
              stroke="var(--sentiment-neutral)"
              name={t("neutral")}
              strokeWidth={2}
              strokeDasharray="5 5"
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
