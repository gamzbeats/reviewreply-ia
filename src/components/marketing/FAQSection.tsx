"use client";

import { useTranslations } from "next-intl";
import Accordion from "@/components/ui/Accordion";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQSection() {
  const t = useTranslations("faq");
  const items = t.raw("items") as FAQItem[];

  return (
    <section className="py-[var(--spacing-section)] px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-[var(--text-display-sm)] font-semibold tracking-[-0.06em]">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted text-[var(--text-body-lg)]">
            {t("subtitle")}
          </p>
        </div>

        <Accordion items={items} />
      </div>
    </section>
  );
}
