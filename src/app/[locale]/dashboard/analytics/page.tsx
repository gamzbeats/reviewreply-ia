"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  AreaChart,
  Area,
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

interface SourceBreakdown {
  source: string;
  count: number;
  avgRating: number;
}

interface TrendData {
  reviews: number;
  positiveRate: number;
  responseRate: number;
}

interface AnalyticsData {
  sentimentOverTime: WeeklyData[];
  ratingDistribution: { rating: number; count: number }[];
  responseRate: number;
  totalReviews: number;
  avgRating: number;
  positiveRate: number;
  sourceBreakdown: SourceBreakdown[];
  trend: TrendData;
}

interface Restaurant {
  id: string;
  name: string;
  googlePlaceId: string | null;
}

const PERIOD_OPTIONS = [
  { value: 28, labelKey: "last4Weeks" },
  { value: 84, labelKey: "last12Weeks" },
  { value: 180, labelKey: "last6Months" },
  { value: 365, labelKey: "last1Year" },
] as const;

const RATING_COLORS: Record<number, string> = {
  5: "#5CBF2A",
  4: "#8BC34A",
  3: "#FFC107",
  2: "#FF9800",
  1: "#F44336",
};

const SOURCE_LABELS: Record<string, string> = {
  GOOGLE: "Google",
  TRIPADVISOR: "TripAdvisor",
  YELP: "Yelp",
};

function TrendBadge({ delta, suffix = "" }: { delta: number; suffix?: string }) {
  if (delta === 0) return <span className="text-xs text-muted">→</span>;
  const up = delta > 0;
  return (
    <span
      className={`text-xs font-semibold ${
        up ? "text-sentiment-positive" : "text-sentiment-negative"
      }`}
    >
      {up ? "↑" : "↓"} {up ? "+" : ""}
      {delta}
      {suffix}
    </span>
  );
}

function KPICard({
  label,
  value,
  trend,
  progressBar,
}: {
  label: string;
  value: string | number;
  trend?: React.ReactNode;
  progressBar?: number;
}) {
  return (
    <div className="bg-card border border-border rounded-[var(--radius-card)] p-4">
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <div className="flex items-end justify-between mt-1 gap-1">
        <p className="text-2xl font-bold leading-tight">{value}</p>
        {trend && <div className="mb-0.5 shrink-0">{trend}</div>}
      </div>
      {progressBar !== undefined && (
        <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full"
            style={{ width: `${Math.min(100, progressBar)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function RatingBar({
  rating,
  count,
  total,
}: {
  rating: number;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-6 text-muted text-right shrink-0">{rating}★</span>
      <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: RATING_COLORS[rating],
          }}
        />
      </div>
      <span className="w-8 text-muted text-right text-xs shrink-0">{pct}%</span>
      <span className="w-6 text-muted text-right text-xs shrink-0">{count}</span>
    </div>
  );
}

function InsightCard({
  icon,
  text,
  sub,
  type,
}: {
  icon: "star" | "reply" | "thumb";
  text: string;
  sub?: string;
  type: "positive" | "negative" | "neutral";
}) {
  const colorClass =
    type === "positive"
      ? "text-sentiment-positive"
      : type === "negative"
        ? "text-sentiment-negative"
        : "text-muted";
  const bgClass =
    type === "positive"
      ? "bg-sentiment-positive-bg"
      : type === "negative"
        ? "bg-sentiment-negative-bg"
        : "bg-background";

  return (
    <div className="flex gap-3 p-4 rounded-[var(--radius-card)] border border-border bg-background">
      <div
        className={`w-8 h-8 rounded-full ${bgClass} flex items-center justify-center shrink-0 mt-0.5`}
      >
        {icon === "star" && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={colorClass}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        )}
        {icon === "reply" && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={colorClass}
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {icon === "thumb" && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={colorClass}
          >
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
        )}
      </div>
      <div>
        <p className="text-sm text-foreground leading-snug">{text}</p>
        {sub && <p className={`text-xs mt-1 ${colorClass}`}>{sub}</p>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [days, setDays] = useState(84);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ imported: number; total: number } | null>(null);

  const fetchAnalytics = useCallback(async (restId: string, d: number) => {
    const res = await fetch(`/api/restaurants/${restId}/analytics?days=${d}`);
    if (res.ok) {
      const json = await res.json();
      setData(json);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/restaurants").then((r) => r.json()),
    ])
      .then(([me, restData]) => {
        setRestaurants(restData.restaurants || []);
        if (me.restaurantId) {
          setRestaurantId(me.restaurantId);
          return fetchAnalytics(me.restaurantId, days);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePeriodChange = (newDays: number) => {
    setDays(newDays);
    if (restaurantId) fetchAnalytics(restaurantId, newDays);
  };

  const handleSwitch = (id: string) => {
    setRestaurantId(id);
    setSyncResult(null);
    fetchAnalytics(id, days);
  };

  const handleSync = async () => {
    if (!restaurantId) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/sync-reviews`, {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        setSyncResult({ imported: result.imported, total: result.total });
        await fetchAnalytics(restaurantId, days);
      }
    } finally {
      setSyncing(false);
    }
  };

  const activeRestaurant = restaurants.find((r) => r.id === restaurantId);
  const hasGooglePlaceId = !!activeRestaurant?.googlePlaceId;

  // Auto-generated insights
  const insights = useMemo(() => {
    if (!data) return [];
    const result: Array<{
      icon: "star" | "reply" | "thumb";
      text: string;
      sub?: string;
      type: "positive" | "negative" | "neutral";
    }> = [];

    // 1. Best week
    const weeksWithData = data.sentimentOverTime.filter(
      (w) => w.total > 0 && w.avgRating > 0
    );
    if (weeksWithData.length > 0) {
      const best = weeksWithData.reduce((a, b) =>
        a.avgRating > b.avgRating ? a : b
      );
      const d = new Date(best.week);
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
      result.push({
        icon: "star",
        text: t("bestWeek", { date: dateStr, rating: String(best.avgRating) }),
        type: "positive",
      });
    } else {
      result.push({
        icon: "star",
        text: t("positiveRateInsight", { rate: String(data.positiveRate) }),
        type: data.positiveRate >= 70 ? "positive" : "negative",
      });
    }

    // 2. Response rate trend
    const rrDelta = data.trend.responseRate;
    if (rrDelta > 0) {
      result.push({
        icon: "reply",
        text: t("responseRateTrendUp", { delta: String(rrDelta) }),
        type: "positive",
      });
    } else if (rrDelta < 0) {
      result.push({
        icon: "reply",
        text: t("responseRateTrendDown", { delta: String(Math.abs(rrDelta)) }),
        type: "negative",
      });
    } else {
      result.push({
        icon: "reply",
        text: t("responseRateTrendFlat"),
        type: "neutral",
      });
    }

    // 3. Positive rate vs threshold
    result.push({
      icon: "thumb",
      text: t("positiveRateInsight", { rate: String(data.positiveRate) }),
      sub: data.positiveRate >= 70 ? t("aboveThreshold") : t("belowThreshold"),
      type: data.positiveRate >= 70 ? "positive" : "negative",
    });

    return result;
  }, [data, t]);

  if (!loaded) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SkeletonStat />
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
      <div className="space-y-6">
        <RestaurantSwitcher activeId={restaurantId} onSwitch={handleSwitch} />
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-full bg-sentiment-neutral-bg flex items-center justify-center mx-auto mb-6">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-sentiment-neutral"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">{t("title")}</h1>
          <p className="text-muted max-w-sm mx-auto leading-relaxed mb-8">{t("noData")}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {hasGooglePlaceId && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center gap-2 bg-brand text-[#111111] px-6 py-3 rounded-[var(--radius-button)] font-medium hover:bg-brand-hover transition-colors text-sm disabled:opacity-60"
              >
                {syncing ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    {t("syncing")}
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
                    </svg>
                    {t("syncGoogle")}
                  </>
                )}
              </button>
            )}
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 border border-border px-6 py-3 rounded-[var(--radius-button)] font-medium hover:bg-card transition-colors text-sm"
            >
              {t("noDataCta")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Merge neutral into positive for chart display
  const chartData = data.sentimentOverTime.map((w) => ({
    ...w,
    positive: w.positive + w.neutral,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = new Date(label);
    const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
    const weekData = payload[0]?.payload as WeeklyData | undefined;
    return (
      <div className="bg-card border border-border rounded-[var(--radius-card)] p-3 text-xs shadow-sm">
        <p className="font-medium text-foreground mb-2">
          {t("week")} {dateStr}
        </p>
        {payload.map((p: { stroke: string; name: string; value: number }) => (
          <p key={p.name} style={{ color: p.stroke }}>
            {p.name}: {p.value}
          </p>
        ))}
        {weekData && weekData.avgRating > 0 && (
          <p className="text-muted mt-1">{weekData.avgRating}★</p>
        )}
      </div>
    );
  };

  const getSourceLabel = (source: string) => {
    if (SOURCE_LABELS[source]) return SOURCE_LABELS[source];
    if (source === "MANUAL") return t("sourceManual");
    return t("sourceOther");
  };

  return (
    <div className="space-y-6">
      <RestaurantSwitcher activeId={restaurantId} onSwitch={handleSwitch} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted text-sm mt-1">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {hasGooglePlaceId && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 border border-border px-3 py-1.5 rounded-[var(--radius-button)] text-sm text-muted hover:text-foreground hover:bg-card transition-colors disabled:opacity-60"
            >
              {syncing ? (
                <>
                  <svg
                    className="animate-spin w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  {t("syncing")}
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
                  </svg>
                  {t("syncGoogle")}
                </>
              )}
            </button>
          )}

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
      </div>

      {/* Sync result banner */}
      {syncResult && (
        <div className="bg-sentiment-positive-bg border border-sentiment-positive/20 rounded-[var(--radius-card)] px-4 py-3 text-sm text-sentiment-positive">
          {t("syncDone", { imported: syncResult.imported, total: syncResult.total })}
        </div>
      )}

      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label={t("totalReviews")}
          value={data.totalReviews}
          trend={<TrendBadge delta={data.trend.reviews} />}
        />
        <KPICard
          label={t("avgRating")}
          value={`${data.avgRating}★`}
        />
        <KPICard
          label={t("responseRate")}
          value={`${data.responseRate}%`}
          trend={<TrendBadge delta={data.trend.responseRate} suffix="%" />}
          progressBar={data.responseRate}
        />
        <KPICard
          label={t("positiveRate")}
          value={`${data.positiveRate}%`}
          trend={<TrendBadge delta={data.trend.positiveRate} suffix="%" />}
          progressBar={data.positiveRate}
        />
      </div>

      {/* Sentiment area chart */}
      <div className="bg-card border border-border rounded-[var(--radius-card)] p-5">
        <h2 className="font-semibold mb-4">{t("sentimentOverTime")}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gradPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--sentiment-positive)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--sentiment-positive)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--sentiment-negative)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--sentiment-negative)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Tooltip content={renderTooltip} />
            <Legend />
            <Area
              type="monotone"
              dataKey="positive"
              stroke="var(--sentiment-positive)"
              fill="url(#gradPositive)"
              name={t("positive")}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="negative"
              stroke="var(--sentiment-negative)"
              fill="url(#gradNegative)"
              name={t("negative")}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Rating distribution + Source breakdown */}
      <div
        className={`grid gap-4 ${
          data.sourceBreakdown.length > 1
            ? "grid-cols-1 lg:grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {/* Rating bars */}
        <div className="bg-card border border-border rounded-[var(--radius-card)] p-5">
          <h2 className="font-semibold mb-5">{t("ratingDistribution")}</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((r) => (
              <RatingBar
                key={r}
                rating={r}
                count={data.ratingDistribution.find((d) => d.rating === r)?.count ?? 0}
                total={data.totalReviews}
              />
            ))}
          </div>
        </div>

        {/* Source breakdown */}
        {data.sourceBreakdown.length > 1 && (
          <div className="bg-card border border-border rounded-[var(--radius-card)] p-5">
            <h2 className="font-semibold mb-5">{t("sourceTitle")}</h2>
            <div className="space-y-4">
              {data.sourceBreakdown.map((s) => {
                const pct =
                  data.totalReviews > 0
                    ? Math.round((s.count / data.totalReviews) * 100)
                    : 0;
                return (
                  <div key={s.source}>
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <span className="font-medium">{getSourceLabel(s.source)}</span>
                      <span className="text-muted">
                        {s.count} · {s.avgRating}★
                      </span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted mt-1">{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-card border border-border rounded-[var(--radius-card)] p-5">
          <h2 className="font-semibold mb-4">{t("insightsTitle")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {insights.map((insight, i) => (
              <InsightCard key={i} {...insight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
