"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useToast } from "@/components/ui/ToastProvider";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Skeleton, { SkeletonCard } from "@/components/ui/Skeleton";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/utils";

interface AnalysisItem {
  theme: string;
  description: string;
  count: number;
  opportunity: string;
}

interface AnalysisData {
  strengths?: AnalysisItem[];
  weaknesses?: AnalysisItem[];
  summary?: string;
}

interface Competitor {
  id: string;
  name: string;
  googlePlaceId: string | null;
  googleRating: number | null;
  lastAnalysis: string | null;
  analysisData: AnalysisData | null;
  createdAt: string;
}

interface PlacePrediction {
  placeId: string;
  name: string;
  address: string;
  description: string;
}

export default function CompetitorsPage() {
  const t = useTranslations("competitors");
  const tModal = useTranslations("modal");
  const locale = useLocale();
  const toast = useToast();

  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [planAllowed, setPlanAllowed] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add form
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlacePrediction | null>(null);
  const [manualName, setManualName] = useState("");
  const [adding, setAdding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((me) => {
        if (me.plan !== "BUSINESS") {
          setPlanAllowed(false);
          setLoaded(true);
          return;
        }
        if (me.restaurantId) {
          setRestaurantId(me.restaurantId);
          return fetch(`/api/restaurants/${me.restaurantId}/competitors`);
        }
        throw new Error("No restaurant");
      })
      .then((r) => {
        if (!r) return;
        return r.json();
      })
      .then((data) => {
        if (data) setCompetitors(data.competitors || []);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Search for places
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.length < 2) {
      setPredictions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions || []);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const handleAdd = async () => {
    if (!restaurantId) return;
    setAdding(true);
    try {
      const body = selectedPlace
        ? { name: selectedPlace.name, googlePlaceId: selectedPlace.placeId }
        : { name: manualName };

      const res = await fetch(`/api/restaurants/${restaurantId}/competitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 403) {
        toast.error(t("limitReached"));
        return;
      }
      if (!res.ok) throw new Error();

      const data = await res.json();
      setCompetitors((prev) => [data.competitor, ...prev]);
      setAddOpen(false);
      resetForm();
    } catch {
      toast.error(t("addError"));
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!restaurantId) return;
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/competitors/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCompetitors((prev) => prev.filter((c) => c.id !== id));
      } else {
        toast.error(t("deleteError"));
      }
    } catch {
      toast.error(t("deleteError"));
    } finally {
      setDeleteId(null);
    }
  };

  const handleAnalyze = async (competitor: Competitor) => {
    if (!restaurantId) return;
    setAnalyzingId(competitor.id);
    try {
      const res = await fetch(
        `/api/restaurants/${restaurantId}/competitors/${competitor.id}?locale=${locale}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCompetitors((prev) =>
        prev.map((c) =>
          c.id === competitor.id
            ? { ...c, analysisData: data.analysis, lastAnalysis: new Date().toISOString() }
            : c
        )
      );
      setExpandedId(competitor.id);
    } catch {
      toast.error(t("analyzeError"));
    } finally {
      setAnalyzingId(null);
    }
  };

  const resetForm = () => {
    setSearchQuery("");
    setPredictions([]);
    setSelectedPlace(null);
    setManualName("");
  };

  if (!loaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-40 rounded-[var(--radius-button)]" />
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!planAllowed) {
    return (
      <div className="text-center py-16 space-y-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted">{t("requiresBusiness")}</p>
        <Link
          href="/dashboard/settings/billing"
          className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius-button)] text-sm font-medium hover:opacity-90"
        >
          Upgrade
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted text-sm mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>{t("addNew")}</Button>
      </div>

      {competitors.length > 0 ? (
        <div className="space-y-4">
          {competitors.map((comp) => (
            <div
              key={comp.id}
              className="bg-card border border-border rounded-[var(--radius-card)] overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{comp.name}</h3>
                  {comp.googleRating && (
                    <p className="text-sm text-muted">Google: {comp.googleRating}/5</p>
                  )}
                  <p className="text-xs text-muted mt-1">
                    {t("lastAnalysis")}: {comp.lastAnalysis ? formatDate(comp.lastAnalysis, locale) : t("never")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAnalyze(comp)}
                    disabled={analyzingId === comp.id}
                  >
                    {analyzingId === comp.id ? t("analyzing") : t("analyze")}
                  </Button>
                  {comp.analysisData && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === comp.id ? null : comp.id)}
                    >
                      {expandedId === comp.id ? "▲" : "▼"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(comp.id)}
                    className="text-sentiment-negative hover:text-sentiment-negative"
                  >
                    {t("delete")}
                  </Button>
                </div>
              </div>

              {/* Expanded analysis */}
              {expandedId === comp.id && comp.analysisData && (
                <div className="border-t border-border p-5 space-y-5">
                  {comp.analysisData.summary && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">{t("summary")}</h4>
                      <p className="text-sm text-foreground/80">{comp.analysisData.summary}</p>
                    </div>
                  )}

                  {comp.analysisData.strengths && comp.analysisData.strengths.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-sentiment-positive">{t("strengths")}</h4>
                      <div className="space-y-3">
                        {comp.analysisData.strengths.map((s, i) => (
                          <div key={i} className="bg-background rounded-[var(--radius-card)] p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{s.theme}</span>
                              <span className="text-xs text-muted">({s.count} mentions)</span>
                            </div>
                            <p className="text-sm text-foreground/80">{s.description}</p>
                            <p className="text-xs text-primary mt-1">
                              <span className="font-medium">{t("opportunity")}:</span> {s.opportunity}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {comp.analysisData.weaknesses && comp.analysisData.weaknesses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-sentiment-negative">{t("weaknesses")}</h4>
                      <div className="space-y-3">
                        {comp.analysisData.weaknesses.map((w, i) => (
                          <div key={i} className="bg-background rounded-[var(--radius-card)] p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{w.theme}</span>
                              <span className="text-xs text-muted">({w.count} mentions)</span>
                            </div>
                            <p className="text-sm text-foreground/80">{w.description}</p>
                            <p className="text-xs text-primary mt-1">
                              <span className="font-medium">{t("opportunity")}:</span> {w.opportunity}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted">
          <p>{t("empty")}</p>
        </div>
      )}

      {/* Add Competitor Modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); resetForm(); }}>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t("addNew")}</h2>

          {/* Google search */}
          <div>
            <label className="block text-sm font-medium mb-1">{t("search")}</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedPlace(null); }}
              placeholder={t("searchPlaceholder")}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-[var(--radius-button)] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {predictions.length > 0 && !selectedPlace && (
              <div className="mt-1 bg-card border border-border rounded-[var(--radius-card)] shadow-lg max-h-48 overflow-y-auto">
                {predictions.map((p) => (
                  <button
                    key={p.placeId}
                    onClick={() => {
                      setSelectedPlace(p);
                      setSearchQuery(p.name);
                      setPredictions([]);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-background transition-colors"
                  >
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted">{p.address}</p>
                  </button>
                ))}
              </div>
            )}
            {selectedPlace && (
              <p className="text-xs text-muted mt-1">{selectedPlace.address}</p>
            )}
          </div>

          {/* Or manual */}
          {!selectedPlace && (
            <div>
              <label className="block text-sm font-medium mb-1">{t("manualName")}</label>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder={t("manualNamePlaceholder")}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-[var(--radius-button)] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setAddOpen(false); resetForm(); }}>
              {tModal("cancel")}
            </Button>
            <Button
              onClick={handleAdd}
              disabled={adding || (!selectedPlace && !manualName.trim())}
            >
              {adding ? t("adding") : t("addButton")}
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
