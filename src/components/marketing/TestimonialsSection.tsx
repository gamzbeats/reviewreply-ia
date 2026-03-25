import { useTranslations } from "next-intl";

interface Testimonial {
  name: string;
  role: string;
  quote: string;
}

export default function TestimonialsSection() {
  const t = useTranslations("testimonials");
  const items = t.raw("items") as Testimonial[];

  return (
    <section className="py-[var(--spacing-section)] px-6 bg-background">
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
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-[var(--radius-card)] p-6 flex flex-col"
            >
              <svg
                className="w-8 h-8 text-primary/20 mb-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M11.3 2.6C6.1 5.1 3.2 9.3 3.2 14c0 3.2 2 5.4 4.5 5.4 2.2 0 3.8-1.6 3.8-3.6 0-2-1.5-3.5-3.4-3.5-.5 0-1 .1-1.2.2.6-3 3-6 6-7.8l-1.6-2.1zm10.3 0C16.4 5.1 13.5 9.3 13.5 14c0 3.2 2 5.4 4.5 5.4 2.2 0 3.8-1.6 3.8-3.6 0-2-1.5-3.5-3.4-3.5-.5 0-1 .1-1.2.2.6-3 3-6 6-7.8l-1.6-2.1z" />
              </svg>
              <p className="text-foreground/80 leading-relaxed flex-1">
                {item.quote}
              </p>
              <div className="mt-6 pt-4 border-t border-border">
                <p className="font-semibold text-sm">{item.name}</p>
                <p className="text-xs text-muted mt-0.5">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
