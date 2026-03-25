"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useToast } from "@/components/ui/ToastProvider";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Tabs from "@/components/ui/Tabs";
import Skeleton, { SkeletonCard } from "@/components/ui/Skeleton";
import { Link } from "@/i18n/navigation";

interface Template {
  id: string;
  name: string;
  content: string;
  tone: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  locale: string;
  createdAt: string;
}

export default function TemplatesPage() {
  const t = useTranslations("templates");
  const tTones = useTranslations("dashboard.form.tones");
  const tModal = useTranslations("modal");
  const tReview = useTranslations("dashboard.review");
  const locale = useLocale();
  const toast = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [planAllowed, setPlanAllowed] = useState(true);
  const [filter, setFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [tone, setTone] = useState("professional");
  const [sentiment, setSentiment] = useState<"POSITIVE" | "NEUTRAL" | "NEGATIVE">("POSITIVE");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((me) => {
        if (me.restaurantId) {
          setRestaurantId(me.restaurantId);
          return fetch(`/api/restaurants/${me.restaurantId}/templates`);
        }
        throw new Error("No restaurant");
      })
      .then((r) => {
        if (r.status === 403) {
          setPlanAllowed(false);
          return { templates: [] };
        }
        return r.json();
      })
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const openCreate = () => {
    setEditTemplate(null);
    setName("");
    setContent("");
    setTone("professional");
    setSentiment("POSITIVE");
    setFormOpen(true);
  };

  const openEdit = (tpl: Template) => {
    setEditTemplate(tpl);
    setName(tpl.name);
    setContent(tpl.content);
    setTone(tpl.tone);
    setSentiment(tpl.sentiment);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!restaurantId || !name.trim() || !content.trim()) return;
    setSaving(true);

    try {
      if (editTemplate) {
        const res = await fetch(
          `/api/restaurants/${restaurantId}/templates/${editTemplate.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, content, tone, sentiment, locale }),
          }
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTemplates((prev) =>
          prev.map((t) => (t.id === editTemplate.id ? data.template : t))
        );
      } else {
        const res = await fetch(`/api/restaurants/${restaurantId}/templates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, content, tone, sentiment, locale }),
        });
        if (res.status === 403) {
          setPlanAllowed(false);
          toast.error(t("requiresPro"));
          return;
        }
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTemplates((prev) => [data.template, ...prev]);
      }
      setFormOpen(false);
    } catch {
      toast.error(editTemplate ? t("updateError") : t("createError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!restaurantId) return;
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/templates/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      } else {
        toast.error(t("deleteError"));
      }
    } catch {
      toast.error(t("deleteError"));
    } finally {
      setDeleteId(null);
    }
  };

  const sentimentTabs = [
    { value: "", label: tReview("positive").charAt(0).toUpperCase() + tReview("positive").slice(1) + " / " + tReview("neutral") + " / " + tReview("negative") },
    { value: "POSITIVE", label: tReview("positive") },
    { value: "NEUTRAL", label: tReview("neutral") },
    { value: "NEGATIVE", label: tReview("negative") },
  ];

  const filtered = filter
    ? templates.filter((t) => t.sentiment === filter)
    : templates;

  if (!loaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36 rounded-[var(--radius-button)]" />
        </div>
        <div className="grid gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!planAllowed) {
    return (
      <div className="text-center py-16 space-y-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted">{t("requiresPro")}</p>
        <Link
          href="/dashboard/settings/billing"
          className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius-button)] text-sm font-medium hover:opacity-90"
        >
          Upgrade
        </Link>
      </div>
    );
  }

  const sentimentMap: Record<string, "positive" | "neutral" | "negative"> = {
    POSITIVE: "positive",
    NEUTRAL: "neutral",
    NEGATIVE: "negative",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted text-sm mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={openCreate}>{t("addNew")}</Button>
      </div>

      {templates.length > 0 && (
        <Tabs
          tabs={sentimentTabs}
          activeTab={filter}
          onTabChange={setFilter}
        />
      )}

      {filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-card border border-border rounded-[var(--radius-card)] p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-semibold">{tpl.name}</h3>
                  <Badge
                    sentiment={sentimentMap[tpl.sentiment]}
                    label={tReview(sentimentMap[tpl.sentiment])}
                  />
                  <span className="text-xs text-muted px-2 py-0.5 bg-background rounded-full">
                    {tTones(tpl.tone as "professional" | "warm" | "casual" | "formal")}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(tpl)}>
                    {t("edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(tpl.id)}
                    className="text-sentiment-negative hover:text-sentiment-negative"
                  >
                    {t("delete")}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                {tpl.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted">
          <p>{t("empty")}</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)}>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {editTemplate ? t("edit") : t("addNew")}
          </h2>

          <div>
            <label className="block text-sm font-medium mb-1">{t("form.name")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("form.namePlaceholder")}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-[var(--radius-button)] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("form.content")}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("form.contentPlaceholder")}
              rows={5}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-[var(--radius-button)] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("form.sentiment")}</label>
              <select
                value={sentiment}
                onChange={(e) => setSentiment(e.target.value as "POSITIVE" | "NEUTRAL" | "NEGATIVE")}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-[var(--radius-button)] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="POSITIVE">{tReview("positive")}</option>
                <option value="NEUTRAL">{tReview("neutral")}</option>
                <option value="NEGATIVE">{tReview("negative")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("form.tone")}</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-[var(--radius-button)] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="professional">{tTones("professional")}</option>
                <option value="warm">{tTones("warm")}</option>
                <option value="casual">{tTones("casual")}</option>
                <option value="formal">{tTones("formal")}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              {tModal("cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim() || !content.trim()}
            >
              {saving
                ? editTemplate
                  ? t("form.updating")
                  : t("form.creating")
                : editTemplate
                  ? t("form.update")
                  : t("form.create")}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        title={t("delete")}
        message={t("deleteConfirm")}
        confirmLabel={tModal("delete")}
        cancelLabel={tModal("cancel")}
        variant="danger"
      />
    </div>
  );
}
