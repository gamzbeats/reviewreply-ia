"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";

interface PlacePrediction {
  placeId: string;
  name: string;
  address: string;
  description: string;
}

interface PlaceInfo {
  name: string;
  address: string;
  rating: number;
  totalReviews: number;
}

interface RestaurantSearchProps {
  onRestaurantSelected: (placeId: string, info: PlaceInfo) => void;
  loading: boolean;
}

export default function RestaurantSearch({
  onRestaurantSelected,
  loading,
}: RestaurantSearchProps) {
  const t = useTranslations("trends");
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<{
    placeId: string;
    name: string;
    address: string;
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    setSelected(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/places/search?q=${encodeURIComponent(value)}`
        );
        const data = await res.json();
        setPredictions(data.predictions || []);
        setShowDropdown(true);
      } catch {
        setPredictions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelect = (prediction: PlacePrediction) => {
    setSelected({
      placeId: prediction.placeId,
      name: prediction.name,
      address: prediction.address,
    });
    setQuery(prediction.name);
    setShowDropdown(false);
    setPredictions([]);
  };

  const handleAnalyze = () => {
    if (selected) {
      onRestaurantSelected(selected.placeId, {
        name: selected.name,
        address: selected.address,
        rating: 0,
        totalReviews: 0,
      });
    }
  };

  return (
    <Card>
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium block mb-2">
            {t("search.label")}
          </label>
          <div className="relative" ref={wrapperRef}>
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => predictions.length > 0 && setShowDropdown(true)}
                placeholder={t("search.placeholder")}
                className="w-full bg-background rounded-[var(--radius-button)] pl-11 pr-10 py-3.5 text-sm outline-none border border-border focus:border-foreground transition-colors"
              />
              {searching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Spinner size="sm" />
                </div>
              )}
            </div>

            {showDropdown && predictions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-card rounded-[var(--radius-button)] border border-border shadow-lg overflow-hidden">
                {predictions.map((prediction) => (
                  <button
                    key={prediction.placeId}
                    type="button"
                    onClick={() => handleSelect(prediction)}
                    className="w-full text-left px-4 py-3 hover:bg-background transition-colors cursor-pointer border-b border-border last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <svg
                        className="text-sentiment-negative mt-0.5 flex-shrink-0"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {prediction.name}
                        </p>
                        <p className="text-xs text-muted truncate">
                          {prediction.address}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selected && (
          <div className="flex items-center justify-between bg-background rounded-[var(--radius-button)] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sentiment-negative-bg flex items-center justify-center flex-shrink-0">
                <svg
                  className="text-sentiment-negative"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">{selected.name}</p>
                <p className="text-xs text-muted">{selected.address}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-foreground text-white px-5 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  {t("search.fetching")}
                </>
              ) : (
                t("search.analyze")
              )}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
