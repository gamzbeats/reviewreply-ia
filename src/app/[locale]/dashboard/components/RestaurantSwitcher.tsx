"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface Restaurant {
  id: string;
  name: string;
  googleRating: number | null;
}

interface RestaurantSwitcherProps {
  activeId: string | null;
  onSwitch: (id: string) => void;
}

export default function RestaurantSwitcher({
  activeId,
  onSwitch,
}: RestaurantSwitcherProps) {
  const t = useTranslations("restaurants");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/restaurants")
      .then((res) => res.json())
      .then((data) => setRestaurants(data.restaurants || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const active = restaurants.find((r) => r.id === activeId);

  if (restaurants.length <= 1) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-[var(--radius-button)] bg-background hover:bg-card transition-colors max-w-[200px]"
      >
        <span className="truncate">{active?.name || t("selectRestaurant")}</span>
        <svg
          className={`w-3 h-3 text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-56 bg-card border border-border rounded-[var(--radius-card)] shadow-lg">
          {restaurants.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onSwitch(r.id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-background transition-colors ${
                r.id === activeId ? "font-medium text-primary" : "text-foreground"
              }`}
            >
              <span className="truncate block">{r.name}</span>
              {r.googleRating && (
                <span className="text-xs text-muted">
                  ★ {r.googleRating.toFixed(1)}
                </span>
              )}
            </button>
          ))}
          <div className="border-t border-border">
            <Link
              href="/dashboard/restaurants"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              {t("manageAll")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
