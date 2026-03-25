import { useTranslations } from "next-intl";
import Card from "@/components/ui/Card";

export default function EmptyState() {
  const t = useTranslations("dashboard");

  return (
    <Card className="text-center py-20">
      <div className="text-6xl mb-6">💬</div>
      <h2 className="text-xl font-semibold mb-2">{t("emptyTitle")}</h2>
      <p className="text-muted max-w-md mx-auto">{t("emptyDescription")}</p>
    </Card>
  );
}
