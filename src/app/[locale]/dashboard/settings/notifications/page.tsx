"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/ToastProvider";
import Toggle from "@/components/ui/Toggle";
import Skeleton from "@/components/ui/Skeleton";

interface Prefs {
  emailNewReview: boolean;
  emailNegativeOnly: boolean;
  emailWeeklyDigest: boolean;
  emailMonthlyReport: boolean;
}

interface PlanFeatures {
  alerts: boolean;
  weeklyDigest: boolean;
  monthlyReport: boolean;
}

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const toast = useToast();

  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [plan, setPlan] = useState<PlanFeatures>({ alerts: false, weeklyDigest: false, monthlyReport: false });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/me/notifications").then((r) => r.json()),
    ])
      .then(([me, notifs]) => {
        const p = me.plan || "FREE";
        setPlan({
          alerts: p === "PRO" || p === "BUSINESS",
          weeklyDigest: p === "PRO" || p === "BUSINESS",
          monthlyReport: p === "BUSINESS",
        });
        setPrefs(notifs);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const update = async (key: keyof Prefs, value: boolean) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);

    try {
      const res = await fetch("/api/me/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("saved"));
    } catch {
      setPrefs(prefs); // revert
      toast.error(t("error"));
    }
  };

  if (!loaded || !prefs) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="bg-card border border-border rounded-[var(--radius-card)] p-5 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted text-sm mt-1">{t("subtitle")}</p>
      </div>

      <div className="bg-card border border-border rounded-[var(--radius-card)] p-5 divide-y divide-border">
        <Toggle
          checked={prefs.emailNewReview}
          onChange={(v) => update("emailNewReview", v)}
          label={t("emailNewReview")}
          description={t("emailNewReviewDesc")}
        />

        <div className="relative">
          <Toggle
            checked={prefs.emailNegativeOnly}
            onChange={(v) => update("emailNegativeOnly", v)}
            disabled={!plan.alerts}
            label={t("emailNegativeOnly")}
            description={t("emailNegativeOnlyDesc")}
          />
          {!plan.alerts && (
            <span className="absolute top-3 right-16 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
              {t("upgradeBadge")}
            </span>
          )}
        </div>

        <div className="relative">
          <Toggle
            checked={prefs.emailWeeklyDigest}
            onChange={(v) => update("emailWeeklyDigest", v)}
            disabled={!plan.weeklyDigest}
            label={t("emailWeeklyDigest")}
            description={t("emailWeeklyDigestDesc")}
          />
          {!plan.weeklyDigest && (
            <span className="absolute top-3 right-16 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
              {t("upgradeBadge")}
            </span>
          )}
        </div>

        <div className="relative">
          <Toggle
            checked={prefs.emailMonthlyReport}
            onChange={(v) => update("emailMonthlyReport", v)}
            disabled={!plan.monthlyReport}
            label={t("emailMonthlyReport")}
            description={t("emailMonthlyReportDesc")}
          />
          {!plan.monthlyReport && (
            <span className="absolute top-3 right-16 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
              {t("upgradeBadge")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
