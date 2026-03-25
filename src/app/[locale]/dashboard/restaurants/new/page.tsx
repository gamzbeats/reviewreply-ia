"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface Prediction {
  placeId: string;
  name: string;
  address: string;
}

export default function NewRestaurantPage() {
  const t = useTranslations("restaurants");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selected, setSelected] = useState<Prediction | null>(null);
  const [manualName, setManualName] = useState("");
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<"google" | "manual">("google");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const searchPlaces = (value: string) => {
    setQuery(value);
    setSelected(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setPredictions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/places/search?q=${encodeURIComponent(value)}`
        );
        const data = await res.json();
        setPredictions(data.predictions || []);
      } catch {
        setPredictions([]);
      }
    }, 300);
  };

  const selectPlace = (prediction: Prediction) => {
    setSelected(prediction);
    setQuery(prediction.name);
    setPredictions([]);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const body =
        mode === "google" && selected
          ? {
              name: selected.name,
              address: selected.address,
              googlePlaceId: selected.placeId,
            }
          : { name: manualName };

      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard/restaurants");
      } else if (data.error === "ALREADY_LINKED") {
        alert(t("alreadyLinked"));
      } else if (data.error === "PLAN_LIMIT") {
        alert(data.message);
      } else {
        alert(t("createError"));
      }
    } catch {
      alert(t("createError"));
    } finally {
      setCreating(false);
    }
  };

  const canCreate =
    mode === "google" ? !!selected : manualName.trim().length > 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("addNew")}</h1>
        <p className="text-muted text-sm mt-1">{t("addNewSubtitle")}</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("google")}
          className={`px-4 py-2 text-sm rounded-[var(--radius-button)] transition-colors ${
            mode === "google"
              ? "bg-primary text-primary-foreground"
              : "bg-background border border-border text-muted"
          }`}
        >
          {t("modeGoogle")}
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`px-4 py-2 text-sm rounded-[var(--radius-button)] transition-colors ${
            mode === "manual"
              ? "bg-primary text-primary-foreground"
              : "bg-background border border-border text-muted"
          }`}
        >
          {t("modeManual")}
        </button>
      </div>

      {mode === "google" ? (
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium mb-1.5">
              {t("searchLabel")}
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => searchPlaces(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full px-3 py-2 border border-border rounded-[var(--radius-button)] bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />

            {predictions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-[var(--radius-card)] shadow-lg max-h-60 overflow-y-auto">
                {predictions.map((p) => (
                  <button
                    key={p.placeId}
                    onClick={() => selectPlace(p)}
                    className="w-full text-left px-3 py-2.5 hover:bg-background transition-colors border-b border-border last:border-0"
                  >
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted">{p.address}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div className="bg-background border border-border rounded-[var(--radius-card)] p-4">
              <p className="font-medium">{selected.name}</p>
              <p className="text-sm text-muted">{selected.address}</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {t("manualNameLabel")}
          </label>
          <input
            type="text"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder={t("manualNamePlaceholder")}
            className="w-full px-3 py-2 border border-border rounded-[var(--radius-button)] bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={!canCreate || creating}
        className="w-full py-2.5 bg-primary text-primary-foreground rounded-[var(--radius-button)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {creating ? t("creating") : t("createButton")}
      </button>
    </div>
  );
}
