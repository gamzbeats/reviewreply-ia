"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import LanguageToggle from "@/components/ui/LanguageToggle";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const t = useTranslations("header");
  const { isSignedIn } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          {t("title")}
        </Link>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-4">
          <LanguageToggle />
          {isSignedIn ? (
            <>
              <Link href="/dashboard">
                <Button size="sm">{t("dashboard")}</Button>
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">{t("signIn")}</Button>
              </Link>
              <Link href="/dashboard">
                <Button size="sm">{t("tryFree")}</Button>
              </Link>
            </>
          )}
        </div>

        {/* Hamburger (mobile only) */}
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

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          ref={menuRef}
          className="sm:hidden bg-background/95 backdrop-blur-md border-b border-border/50 shadow-lg"
        >
          <div className="flex flex-col p-4 gap-3">
            <LanguageToggle />
            {isSignedIn ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full">{t("dashboard")}</Button>
                </Link>
                <div className="flex justify-center pt-1">
                  <UserButton />
                </div>
              </>
            ) : (
              <>
                <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full">{t("signIn")}</Button>
                </Link>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full">{t("tryFree")}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
