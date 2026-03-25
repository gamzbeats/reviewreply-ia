import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Button from "@/components/ui/Button";

export default function HeroSection() {
  const t = useTranslations("hero");
  const tSocial = useTranslations("socialProof");

  return (
    <section className="pt-32 pb-20 px-6 md:pt-44 md:pb-[var(--spacing-section)]">
      <div className="max-w-[1200px] mx-auto text-center">
        <h1 className="text-[clamp(36px,5vw,var(--text-display))] font-semibold leading-[110%] tracking-[-0.06em] max-w-4xl mx-auto">
          {t("title")}
        </h1>
        <p className="mt-6 text-[var(--text-body-lg)] text-muted max-w-2xl mx-auto leading-relaxed">
          {t("subtitle")}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg">{t("cta")}</Button>
          </Link>
          <a href="#how-it-works">
            <Button variant="secondary" size="lg">
              {t("ctaSecondary")}
            </Button>
          </a>
        </div>

        {/* Social proof bar */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>{tSocial("restaurants")}</span>
          </div>
          <span className="hidden sm:block text-border">|</span>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>{tSocial("reviews")}</span>
          </div>
          <span className="hidden sm:block text-border">|</span>
          <div className="flex items-center gap-2">
            <span className="text-lg">Google</span>
            <span className="text-lg">TripAdvisor</span>
            <span className="text-lg">Yelp</span>
          </div>
        </div>
      </div>
    </section>
  );
}
