import { useTranslations } from "next-intl";
import Card from "@/components/ui/Card";

export default function HowItWorksSection() {
  const t = useTranslations("howItWorks");

  const steps = [
    { number: t("step1.number"), title: t("step1.title"), description: t("step1.description") },
    { number: t("step2.number"), title: t("step2.title"), description: t("step2.description") },
    { number: t("step3.number"), title: t("step3.title"), description: t("step3.description") },
  ];

  return (
    <section id="how-it-works" className="py-[var(--spacing-section)] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-[var(--text-display-sm)] font-semibold tracking-[-0.06em]">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted text-[var(--text-body-lg)]">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <Card key={i} className="relative">
              <span className="text-[var(--text-display)] font-bold text-border/60 absolute top-6 right-8 leading-none">
                {step.number}
              </span>
              <div className="relative">
                <h3 className="text-xl font-semibold mb-3 mt-8">{step.title}</h3>
                <p className="text-muted leading-relaxed">{step.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
