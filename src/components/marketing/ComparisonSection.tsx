import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Button from "@/components/ui/Button";

const rows: { chatgpt: boolean; reviewreply: boolean }[] = [
  { chatgpt: true, reviewreply: true },
  { chatgpt: false, reviewreply: true },
  { chatgpt: false, reviewreply: true },
  { chatgpt: false, reviewreply: true },
  { chatgpt: false, reviewreply: true },
  { chatgpt: false, reviewreply: true },
];

function Check() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#5CBF2A]">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Cross() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted/50">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function ComparisonSection() {
  const t = useTranslations("comparison");

  return (
    <section className="py-[var(--spacing-section)] px-6 bg-card">
      <div className="max-w-[900px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-[var(--text-display-sm)] font-semibold tracking-[-0.06em]">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted text-[var(--text-body-lg)]">
            {t("subtitle")}
          </p>
        </div>

        <div className="bg-background rounded-[var(--radius-card)] border border-border overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center px-6 py-4 border-b border-border bg-card">
            <div />
            <div className="w-32 text-center text-sm font-medium text-muted">
              {t("chatgptCol")}
            </div>
            <div className="w-32 text-center text-sm font-semibold text-brand">
              {t("reviewreplyCol")}
            </div>
          </div>

          {/* Feature rows */}
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto_auto] items-center px-6 py-4 border-b border-border last:border-b-0 hover:bg-card transition-colors"
            >
              <span className="text-sm text-foreground pr-4">
                {t(`row${i}` as "row0")}
              </span>
              <div className="w-32 flex justify-center">
                {row.chatgpt ? <Check /> : <Cross />}
              </div>
              <div className="w-32 flex justify-center">
                {row.reviewreply ? <Check /> : <Cross />}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/dashboard">
            <Button size="lg">{t("cta")}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
