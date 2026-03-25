"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { UserButton } from "@clerk/nextjs";
import LanguageToggle from "@/components/ui/LanguageToggle";
import { cn } from "@/lib/utils";

export default function DashboardHeader() {
  const t = useTranslations();
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard" as const, label: t("dashboard.title") },
    { href: "/dashboard/trends" as const, label: t("trends.nav") },
    { href: "/dashboard/analytics" as const, label: t("analytics.nav") },
    { href: "/dashboard/restaurants" as const, label: t("restaurants.nav") },
    { href: "/dashboard/settings/billing" as const, label: t("settings.billing") },
  ];

  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          {t("header.title")}
        </Link>

        <div className="flex items-center gap-6">
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
          <LanguageToggle />
          <UserButton />
        </div>
      </div>
    </header>
  );
}
