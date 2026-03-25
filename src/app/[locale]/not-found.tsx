import { useTranslations } from "next-intl";
import Card from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("errors");

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Card className="max-w-md w-full text-center">
        <h1 className="text-[var(--text-display)] font-bold mb-2">404</h1>
        <h2 className="text-[var(--text-display-sm)] font-semibold mb-3">
          {t("notFound")}
        </h2>
        <p className="text-muted mb-6">{t("notFoundDescription")}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-foreground text-white rounded-[var(--radius-button)] font-medium hover:bg-accent transition-colors"
        >
          {t("backToHome")}
        </Link>
      </Card>
    </div>
  );
}
