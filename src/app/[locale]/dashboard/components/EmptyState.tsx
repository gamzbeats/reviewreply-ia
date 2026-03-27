import { useTranslations } from "next-intl";
import Card from "@/components/ui/Card";

export default function EmptyState() {
  const t = useTranslations("dashboard");

  return (
    <Card className="text-center py-16 px-8">
      <div className="w-14 h-14 rounded-full bg-sentiment-positive-bg flex items-center justify-center mx-auto mb-6">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sentiment-positive">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-3">{t("emptyTitle")}</h2>
      <p className="text-muted max-w-md mx-auto leading-relaxed mb-8">
        {t("emptyDescription")}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-full text-sm text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          {t("emptyBadge1")}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-full text-sm text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          {t("emptyBadge2")}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-full text-sm text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {t("emptyBadge3")}
        </div>
      </div>
    </Card>
  );
}
