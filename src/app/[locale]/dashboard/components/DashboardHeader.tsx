"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { UserButton } from "@clerk/nextjs";
import LanguageToggle from "@/components/ui/LanguageToggle";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

export default function DashboardHeader() {
  const t = useTranslations();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: "/dashboard" as const, label: t("dashboard.title") },
    { href: "/dashboard/trends" as const, label: t("trends.nav") },
    { href: "/dashboard/analytics" as const, label: t("analytics.nav") },
    { href: "/dashboard/templates" as const, label: t("templates.nav") },
    { href: "/dashboard/competitors" as const, label: t("competitors.nav") },
    { href: "/dashboard/restaurants" as const, label: t("restaurants.nav") },
    { href: "/dashboard/settings/billing" as const, label: t("settings.billing") },
  ];

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [mobileOpen]);

  return (
    <header className="bg-card border-b border-border relative">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          {t("header.title")}
        </Link>

        <div className="flex items-center gap-6">
          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-[var(--radius-button)] transition-colors",
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "font-medium text-foreground bg-background"
                    : "text-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <ThemeToggle />
          <LanguageToggle />
          <UserButton />

          {/* Hamburger button (mobile only) */}
          <button
            className="sm:hidden flex flex-col gap-1.5 p-2 -mr-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <span
              className={cn(
                "block w-5 h-0.5 bg-foreground transition-all duration-200",
                mobileOpen && "rotate-45 translate-y-2"
              )}
            />
            <span
              className={cn(
                "block w-5 h-0.5 bg-foreground transition-all duration-200",
                mobileOpen && "opacity-0"
              )}
            />
            <span
              className={cn(
                "block w-5 h-0.5 bg-foreground transition-all duration-200",
                mobileOpen && "-rotate-45 -translate-y-2"
              )}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          ref={menuRef}
          className="sm:hidden absolute top-16 left-0 right-0 bg-card border-b border-border z-50 shadow-lg"
        >
          <nav className="flex flex-col p-4 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-3 text-sm rounded-[var(--radius-button)] transition-colors",
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "font-medium text-foreground bg-background"
                    : "text-muted hover:text-foreground hover:bg-background"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
