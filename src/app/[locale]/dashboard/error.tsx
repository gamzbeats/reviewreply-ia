"use client";

import { useTranslations } from "next-intl";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const router = useRouter();

  return (
    <Card className="max-w-md mx-auto text-center mt-16">
      <h1 className="text-[var(--text-display-sm)] font-bold mb-3">
        {t("title")}
      </h1>
      <p className="text-muted mb-6">{t("description")}</p>
      <div className="flex gap-3 justify-center">
        <Button onClick={reset}>{t("retry")}</Button>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>
          {t("backToDashboard")}
        </Button>
      </div>
    </Card>
  );
}
