"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import LanguageToggle from "@/components/ui/LanguageToggle";
import Button from "@/components/ui/Button";

export default function Header() {
  const t = useTranslations("header");
  const { isSignedIn } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          {t("title")}
        </Link>

        <div className="flex items-center gap-4">
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
      </div>
    </header>
  );
}
