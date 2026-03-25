"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton, { SkeletonCard } from "@/components/ui/Skeleton";

interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  googlePlaceId: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  syncEnabled: boolean;
  lastSyncAt: string | null;
  _count: { reviews: number };
}

export default function RestaurantsPage() {
  const t = useTranslations("restaurants");
  const tModal = useTranslations("modal");
  const toast = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/restaurants")
      .then((res) => res.json())
      .then((data) => setRestaurants(data.restaurants || []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const handleSync = async (id: string) => {
    setSyncing(id);
    try {
      const res = await fetch(`/api/restaurants/${id}/sync`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh list
        const listRes = await fetch("/api/restaurants");
        const listData = await listRes.json();
        setRestaurants(listData.restaurants || []);
        toast.success(t("syncSuccess", { inserted: data.inserted, skipped: data.skipped }));
      }
    } catch {
      toast.error(t("syncError"));
    } finally {
      setSyncing(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/restaurants/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRestaurants((prev) => prev.filter((r) => r.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || t("deleteError"));
      }
    } catch {
      toast.error(t("deleteError"));
    } finally {
      setDeleteId(null);
    }
  };

  if (!loaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36 rounded-[var(--radius-button)]" />
        </div>
        <div className="grid gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted text-sm mt-1">{t("subtitle")}</p>
        </div>
        <Link
          href="/dashboard/restaurants/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius-button)] text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {t("addNew")}
        </Link>
      </div>

      <div className="grid gap-4">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="bg-card border border-border rounded-[var(--radius-card)] p-5"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                {restaurant.address && (
                  <p className="text-sm text-muted">{restaurant.address}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted mt-2">
                  {restaurant.googleRating && (
                    <span>
                      ★ {restaurant.googleRating.toFixed(1)}
                    </span>
                  )}
                  <span>
                    {restaurant._count.reviews} {t("reviewCount")}
                  </span>
                  {restaurant.lastSyncAt && (
                    <span>
                      {t("lastSync")}: {new Date(restaurant.lastSyncAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {restaurant.googlePlaceId && (
                  <button
                    onClick={() => handleSync(restaurant.id)}
                    disabled={syncing === restaurant.id}
                    className="px-3 py-1.5 text-sm border border-border rounded-[var(--radius-button)] hover:bg-background transition-colors disabled:opacity-50"
                  >
                    {syncing === restaurant.id ? t("syncing") : t("sync")}
                  </button>
                )}
                <button
                  onClick={() => setDeleteId(restaurant.id)}
                  className="px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-[var(--radius-button)] hover:bg-red-50 transition-colors"
                >
                  {t("delete")}
                </button>
              </div>
            </div>

            {restaurant.googlePlaceId && (
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    restaurant.syncEnabled ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span className="text-xs text-muted">
                  {restaurant.syncEnabled ? t("syncEnabled") : t("syncDisabled")}
                </span>
              </div>
            )}
          </div>
        ))}

        {restaurants.length === 0 && (
          <div className="text-center py-12 text-muted">
            <p>{t("empty")}</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        title={t("delete")}
        message={t("deleteConfirm")}
        confirmLabel={tModal("delete")}
        cancelLabel={tModal("cancel")}
        variant="danger"
      />
    </div>
  );
}
