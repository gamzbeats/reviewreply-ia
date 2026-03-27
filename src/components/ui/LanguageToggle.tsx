"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: "fr" | "en") => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center bg-card rounded-full p-1 gap-0.5">
      <button
        onClick={() => switchLocale("fr")}
        className={cn(
          "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer",
          locale === "fr"
            ? "bg-foreground text-background"
            : "text-muted hover:text-foreground"
        )}
      >
        FR
      </button>
      <button
        onClick={() => switchLocale("en")}
        className={cn(
          "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer",
          locale === "en"
            ? "bg-foreground text-background"
            : "text-muted hover:text-foreground"
        )}
      >
        EN
      </button>
    </div>
  );
}
