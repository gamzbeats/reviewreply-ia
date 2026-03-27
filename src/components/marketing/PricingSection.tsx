import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function PricingSection() {
  const t = useTranslations("pricing");
  const tSocial = useTranslations("socialProof");

  const freeFeatures = t.raw("free.features") as string[];
  const proFeatures = t.raw("pro.features") as string[];
  const businessFeatures = t.raw("business.features") as string[];

  const plans = [
    {
      name: t("free.name"),
      price: t("free.price"),
      period: t("free.period"),
      features: freeFeatures,
      cta: t("free.cta"),
      href: "/dashboard",
      popular: false,
      enabled: true,
    },
    {
      name: t("pro.name"),
      price: t("pro.price"),
      period: t("pro.period"),
      features: proFeatures,
      cta: t("pro.cta"),
      href: "/dashboard/settings/billing",
      popular: true,
      badge: t("pro.badge"),
      enabled: true,
    },
    {
      name: t("business.name"),
      price: t("business.price"),
      period: t("business.period"),
      features: businessFeatures,
      cta: t("business.cta"),
      href: "/dashboard/settings/billing",
      popular: false,
      enabled: true,
    },
  ];

  return (
    <section id="pricing" className="py-[var(--spacing-section)] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-[var(--text-display-sm)] font-semibold tracking-[-0.06em]">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted text-[var(--text-body-lg)]">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8 text-sm text-muted">
          <svg className="w-5 h-5 text-sentiment-positive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
          <span>{tSocial("satisfaction")}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.popular
                  ? "border-2 border-foreground relative"
                  : "border border-border"
              }
            >
              {plan.popular && plan.badge && (
                <span className="absolute -top-3 left-6 bg-brand text-[#111111] text-xs font-medium px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-[var(--text-display-sm)] font-bold">
                  {plan.price}
                </span>
                <span className="text-muted">{plan.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-[var(--text-body-lg)]"
                  >
                    <svg
                      className="w-5 h-5 text-sentiment-positive shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className="block mt-8">
                <Button
                  variant={plan.popular ? "primary" : "secondary"}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
