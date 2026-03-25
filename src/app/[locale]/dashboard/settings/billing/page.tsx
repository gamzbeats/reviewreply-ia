"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface UserInfo {
  plan: string;
  email: string;
}

const PRICE_IDS = {
  PRO: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "",
  BUSINESS: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || "",
};

export default function BillingPage() {
  const t = useTranslations("billing");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [usage, setUsage] = useState<{
    analyzes: number;
    trends: number;
  } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setUser({ plan: data.plan, email: data.email }))
      .catch(() => {});

    fetch("/api/billing/usage")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {});
  }, []);

  const handleUpgrade = async (plan: "PRO" | "BUSINESS") => {
    setLoading(plan);
    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: PRICE_IDS[plan] }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert(t("error"));
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert(t("error"));
    } finally {
      setLoading(null);
    }
  };

  if (!user) return null;

  const plans = [
    {
      key: "FREE" as const,
      price: "0€",
      features: [
        t("features.analyzes10"),
        t("features.oneRestaurant"),
        t("features.history30"),
        t("features.oneTrend"),
      ],
    },
    {
      key: "PRO" as const,
      price: "19€",
      popular: true,
      features: [
        t("features.unlimitedAnalyzes"),
        t("features.oneRestaurant"),
        t("features.unlimitedHistory"),
        t("features.unlimitedTrends"),
        t("features.toneCustomization"),
        t("features.templates"),
        t("features.alerts"),
        t("features.weeklyDigest"),
      ],
    },
    {
      key: "BUSINESS" as const,
      price: "49€",
      features: [
        t("features.unlimitedAnalyzes"),
        t("features.tenRestaurants"),
        t("features.unlimitedHistory"),
        t("features.unlimitedTrends"),
        t("features.toneCustomization"),
        t("features.templates"),
        t("features.alerts"),
        t("features.weeklyDigest"),
        t("features.competitors"),
        t("features.monthlyReport"),
        t("features.team"),
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted text-sm mt-1">{t("subtitle")}</p>
      </div>

      {/* Current plan */}
      <div className="bg-card border border-border rounded-[var(--radius-card)] p-5">
        <p className="text-sm text-muted">{t("currentPlan")}</p>
        <p className="text-xl font-bold mt-1">{user.plan}</p>
        {usage && user.plan === "FREE" && (
          <div className="mt-3 space-y-2">
            <div>
              <div className="flex justify-between text-xs text-muted mb-1">
                <span>{t("analyzesUsed")}</span>
                <span>{usage.analyzes}/10</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min((usage.analyzes / 10) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
        {user.plan !== "FREE" && (
          <button
            onClick={handlePortal}
            disabled={loading === "portal"}
            className="mt-3 text-sm text-primary hover:underline"
          >
            {t("manageSubscription")}
          </button>
        )}
      </div>

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`bg-card border rounded-[var(--radius-card)] p-5 ${
              plan.popular
                ? "border-primary ring-1 ring-primary"
                : "border-border"
            }`}
          >
            {plan.popular && (
              <span className="inline-block text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full mb-3">
                {t("popular")}
              </span>
            )}
            <h3 className="font-semibold">{plan.key}</h3>
            <p className="text-3xl font-bold mt-1">
              {plan.price}
              <span className="text-sm font-normal text-muted">
                {t("perMonth")}
              </span>
            </p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">&#10003;</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              {user.plan === plan.key ? (
                <span className="block text-center text-sm text-muted py-2">
                  {t("currentPlanLabel")}
                </span>
              ) : plan.key === "FREE" ? null : (
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={loading === plan.key}
                  className="w-full py-2 bg-primary text-primary-foreground rounded-[var(--radius-button)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading === plan.key ? t("redirecting") : t("upgrade")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
