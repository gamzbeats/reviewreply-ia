"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useToast } from "@/components/ui/ToastProvider";
import Skeleton from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";

interface UserInfo {
  plan: string;
  email: string;
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Invoice {
  id: string;
  number: string | null;
  date: string | null;
  amount: number;
  currency: string;
  status: string | null;
  pdfUrl: string | null;
}

const PRICE_IDS = {
  PRO: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "",
  BUSINESS: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || "",
};

export default function BillingPage() {
  const t = useTranslations("billing");
  const locale = useLocale();
  const toast = useToast();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [usage, setUsage] = useState<{
    analyzes: number;
    trends: number;
  } | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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

    fetch("/api/billing/subscription")
      .then((r) => r.json())
      .then((data) => setSubscription(data.subscription))
      .catch(() => {});

    fetch("/api/billing/invoices")
      .then((r) => r.json())
      .then((data) => setInvoices(data.invoices || []))
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
      toast.error(t("error"));
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
      toast.error(t("error"));
    } finally {
      setLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
        <div className="bg-card border border-border rounded-[var(--radius-card)] p-5 space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-[var(--radius-card)] p-5 space-y-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-12" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
              <Skeleton className="h-9 w-full rounded-[var(--radius-button)]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

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

      {/* Subscription details */}
      {subscription && (
        <div className="bg-card border border-border rounded-[var(--radius-card)] p-5 space-y-2">
          <h2 className="font-semibold">{t("subscriptionStatus")}</h2>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
              subscription.status === "active"
                ? "bg-sentiment-positive/10 text-sentiment-positive"
                : "bg-sentiment-negative/10 text-sentiment-negative"
            }`}>
              {subscription.status === "active" ? t("active") : t("canceled")}
            </span>
            {subscription.cancelAtPeriodEnd ? (
              <span className="text-sm text-muted">
                {t("cancelsOn")} {formatDate(subscription.currentPeriodEnd, locale)}
              </span>
            ) : (
              <span className="text-sm text-muted">
                {t("renewsOn")} {formatDate(subscription.currentPeriodEnd, locale)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Invoices table */}
      {invoices.length > 0 && (
        <div className="bg-card border border-border rounded-[var(--radius-card)] overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold">{t("invoices")}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="px-5 py-3 font-medium">{t("invoiceDate")}</th>
                  <th className="px-5 py-3 font-medium">{t("invoiceAmount")}</th>
                  <th className="px-5 py-3 font-medium">{t("invoiceStatus")}</th>
                  <th className="px-5 py-3 font-medium">{t("invoicePdf")}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      {inv.date ? formatDate(inv.date, locale) : "—"}
                    </td>
                    <td className="px-5 py-3 font-medium">
                      {(inv.amount / 100).toFixed(2)} {inv.currency.toUpperCase()}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        inv.status === "paid"
                          ? "bg-sentiment-positive/10 text-sentiment-positive"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {inv.status === "paid" ? t("paid") : t("open")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {inv.pdfUrl && (
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {t("download")}
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
