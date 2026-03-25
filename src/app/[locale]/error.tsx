"use client";

import { useTranslations } from "next-intl";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Card className="max-w-md w-full text-center">
        <h1 className="text-[var(--text-display-sm)] font-bold mb-3">
          {t("title")}
        </h1>
        <p className="text-muted mb-6">{t("description")}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>{t("retry")}</Button>
          <Button variant="secondary" onClick={() => (window.location.href = "/")}>
            {t("backToHome")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
