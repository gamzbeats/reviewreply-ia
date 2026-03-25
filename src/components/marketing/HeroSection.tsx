import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Button from "@/components/ui/Button";

export default function HeroSection() {
  const t = useTranslations("hero");

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
      </div>
    </section>
  );
}
