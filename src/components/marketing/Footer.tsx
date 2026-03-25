import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-dark text-white py-16 px-6 mt-[var(--spacing-section)]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-xl font-semibold mb-4">ReviewReply</h3>
            <p className="text-white/60 leading-relaxed">{t("description")}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("product")}</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-white/60 hover:text-white transition-colors">
                  {t("links.features")}
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-white/60 hover:text-white transition-colors">
                  {t("links.pricing")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("legal")}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-white/60 hover:text-white transition-colors">
                  {t("links.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/60 hover:text-white transition-colors">
                  {t("links.terms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
          {t("copyright")}
        </div>
      </div>
    </footer>
  );
}
