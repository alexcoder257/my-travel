"use client";

import { useItinerary } from "@/hooks/useItinerary";
import { ItineraryCard } from "@/components/ItineraryCard";
import { ImportDialog } from "@/components/ImportDialog";
import { ShareModal } from "@/components/ShareModal";
import { FileUp, Search, X, Trash2, Plus, SlidersHorizontal, Users } from "lucide-react";
import { useMemo, useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { updateItineraryItem, deleteAllItineraryItems } from "@/lib/firestore";
import { ItineraryItem } from "@/types/index";
import { CreateItemModal } from "@/components/CreateItemModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";
import { TripLoader } from "@/components/TripLoader";
import { useTranslation } from "@/lib/i18n";
import { useTripData } from "@/contexts/TripDataContext";
import { useParams } from "next/navigation";

type CategoryFilter = "all" | "food" | "place" | "transport" | "other";
type StatusFilter = "all" | "visited" | "unvisited";
type CountryFilter = "all" | "sg" | "my";

function getCountry(item: ItineraryItem): "sg" | "my" | "both" {
  if (item.estimatedPrice.currency === "SGD") return "sg";
  if (item.estimatedPrice.currency === "MYR") return "my";
  return "both";
}

const PILL =
  "shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors";
const PILL_ACTIVE =
  "text-white";
const PILL_IDLE =
  "bg-[var(--sand-100)] text-[var(--nature-800)] hover:bg-[var(--sand-200)]";

export default function ItineraryPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<TripLoader label={t("common.loading")} />}>
      <ItineraryContent />
    </Suspense>
  );
}

function ItineraryContent() {
  const { items: initialItems, loading, toggleVisited, canEdit, isOwner, trip } = useTripData();
  const params = useParams();
  const tripId = params?.tripId as string;
  const searchParams = useSearchParams();
  const toast = useToast();
  const { t } = useTranslation();
  const [items, setItems] = useState(initialItems);

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<CountryFilter>("all");
  const [day, setDay] = useState<number | "all">("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [foldedDays, setFoldedDays] = useState<Record<string, boolean>>({});
  const [showImport, setShowImport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [createModal, setCreateModal] = useState<null | { day: number; date: string; order: number }>(null);

  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const scrollToId = searchParams.get("scrollTo");
  const expandId = searchParams.get("expand");
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    const expand = expandId;
    if (!expand || !items.length) return;
    const target = items.find((i) => i.id === expand);
    if (!target) return;
    const key = target.day.toString();
    setFoldedDays((prev) => {
      if (prev[key] === true) return { ...prev, [key]: false };
      return prev;
    });
  }, [expandId, items]);

  useEffect(() => {
    const scroll = scrollToId;
    if (scroll && cardRefs.current && cardRefs.current[scroll]) {
      const timer = setTimeout(() => {
        cardRefs.current[scroll]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [scrollToId, items, foldedDays]);

  const isFiltering = search.trim() !== "" || country !== "all" || day !== "all" || category !== "all" || status !== "all";

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      await deleteAllItineraryItems(tripId);
      toast.success(t("common.success"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setDeleting(false);
      setShowDeleteAll(false);
    }
  };

  const clearFilters = () => {
    setSearch(""); setCountry("all"); setDay("all"); setCategory("all"); setStatus("all");
  };

  const allDays = useMemo(
    () => [...new Set(items.map((i) => i.day))].sort((a, b) => a - b),
    [items]
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (status === "visited" && !item.visited) return false;
      if (status === "unvisited" && item.visited) return false;
      if (day !== "all" && item.day !== day) return false;
      if (country !== "all") {
        const c = getCountry(item);
        if (c !== country) return false;
      }
      if (q) {
        const hay = `${item.activity} ${item.location} ${item.notes || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, search, country, day, category, status]);

  const groupedByDay = useMemo(() => {
    const grouped = filteredItems.reduce((acc, item) => {
      if (!acc[item.day]) acc[item.day] = [];
      acc[item.day].push(item);
      return acc;
    }, {} as Record<number, typeof filteredItems>);
    Object.keys(grouped).forEach((d) => {
      grouped[Number(d)].sort((a, b) => a.order - b.order);
    });
    return grouped;
  }, [filteredItems]);

  const effectiveFoldedDays = isFiltering ? {} : foldedDays;

  const visitedTotal = items.filter((i) => i.visited).length;
  const progress = items.length > 0 ? visitedTotal / items.length : 0;

  if (loading) return <TripLoader label={t("common.loading")} />;

  return (
    <div className="pb-6" style={{ background: "var(--surface-body)" }}>
      {/* ── HEADER ── */}
      <div
        className="sticky top-0 z-20 px-5 pt-[max(env(safe-area-inset-top),14px)] pb-3"
        style={{ background: "var(--surface-body)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[26px] font-extrabold leading-tight" style={{ color: "var(--nature-900)" }}>
              {t("itinerary.title")}
            </h1>
            {items.length > 0 && (
              <p className="text-[12px] mt-0.5" style={{ color: "var(--surface-muted)" }}>
                {t("itinerary.visited_count", { visited: visitedTotal, total: items.length })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={() => setShowShare(true)}
                className="w-9 h-9 rounded-full grid place-items-center transition-colors bg-blue-50 text-blue-600 border border-blue-100"
                aria-label="Chia sẻ"
              >
                <Users className="w-4 h-4" />
              </button>
            )}
            {canEdit && items.length > 0 && (
              <button
                onClick={() => setShowDeleteAll(true)}
                aria-label={t("itinerary.delete_all")}
                className="w-9 h-9 rounded-full grid place-items-center"
                style={{ background: "rgba(177,69,82,0.1)", color: "var(--accent-berry)" }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => setShowImport(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold text-white"
                style={{ background: "var(--nature-700)" }}
              >
                <FileUp className="w-3.5 h-3.5" />
                {t("itinerary.import")}
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {items.length > 0 && (
          <div className="h-1.5 w-full rounded-full overflow-hidden mb-3" style={{ background: "var(--sand-200)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg,var(--nature-500),var(--accent-leaf))" }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.8, ease: [0.22, 0.68, 0, 1] }}
            />
          </div>
        )}

        {/* Search + filter toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--surface-muted)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("itinerary.search_placeholder")}
              className="w-full pl-9 pr-9 py-2.5 rounded-full outline-none text-[13px]"
              style={{ background: "var(--sand-100)", color: "var(--nature-900)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--surface-muted)" }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="w-10 h-10 rounded-full grid place-items-center flex-shrink-0 transition-colors"
            style={{
              background: filtersOpen || isFiltering ? "var(--nature-700)" : "var(--sand-100)",
              color: filtersOpen || isFiltering ? "#fff" : "var(--nature-800)",
            }}
            aria-label={t("itinerary.filter")}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Filter drawer */}
        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              key="filter-drawer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 0.68, 0, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2.5">
                {/* Country */}
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide shrink-0" style={{ color: "var(--surface-muted)" }}>{t("itinerary.country")}</span>
                  {(["all", "sg", "my"] as CountryFilter[]).map((c) => {
                    const label = c === "all" ? t("itinerary.all") : c === "sg" ? "🇸🇬 SG" : "🇲🇾 MY";
                    return (
                      <button key={c} onClick={() => setCountry(c)}
                        className={`${PILL} ${country === c ? PILL_ACTIVE : PILL_IDLE}`}
                        style={country === c ? { background: "var(--nature-700)" } : {}}>
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide shrink-0" style={{ color: "var(--surface-muted)" }}>{t("itinerary.status")}</span>
                  {(["all", "visited", "unvisited"] as StatusFilter[]).map((s) => {
                    const label = s === "all" ? t("itinerary.all") : s === "visited" ? t("itinerary.visited") : t("itinerary.unvisited");
                    const activeBg = s === "visited" ? "var(--nature-600)" : s === "unvisited" ? "#e27e35" : "var(--nature-700)";
                    return (
                      <button key={s} onClick={() => setStatus(s)}
                        className={`${PILL} ${status === s ? PILL_ACTIVE : PILL_IDLE}`}
                        style={status === s ? { background: activeBg } : {}}>
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Days */}
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide shrink-0" style={{ color: "var(--surface-muted)" }}>{t("itinerary.day")}</span>
                  <button onClick={() => setDay("all")}
                    className={`${PILL} ${day === "all" ? PILL_ACTIVE : PILL_IDLE}`}
                    style={day === "all" ? { background: "var(--nature-700)" } : {}}>
                    {t("itinerary.all")}
                  </button>
                  {allDays.map((d) => (
                    <button key={d} onClick={() => setDay(d)}
                      className={`${PILL} ${day === d ? PILL_ACTIVE : PILL_IDLE}`}
                      style={day === d ? { background: "var(--nature-700)" } : {}}>
                      N.{d}
                    </button>
                  ))}
                </div>

                {/* Category */}
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide shrink-0" style={{ color: "var(--surface-muted)" }}>{t("itinerary.category")}</span>
                  {([ ["all",t("itinerary.all")], ["food","🍜 Ăn"], ["place","📍 Điểm"], ["transport","🚌 Đi"], ["other","✦ Khác"] ] as [CategoryFilter,string][]).map(([c, label]) => (
                    <button key={c} onClick={() => setCategory(c)}
                      className={`${PILL} ${category === c ? PILL_ACTIVE : PILL_IDLE}`}
                      style={category === c ? { background: "var(--nature-700)" } : {}}>
                      {label}
                    </button>
                  ))}
                </div>

                {isFiltering && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[12px]" style={{ color: "var(--surface-muted)" }}>{filteredItems.length} kết quả</span>
                    <button onClick={clearFilters}
                      className="text-[12px] font-semibold inline-flex items-center gap-1"
                      style={{ color: "var(--accent-berry)" }}>
                      <X className="w-3 h-3" /> {t("itinerary.clear_filters")}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── EMPTY STATE ── */}
      {Object.keys(groupedByDay).length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 px-8 text-center gap-4"
        >
          <div
            className="w-20 h-20 rounded-full grid place-items-center text-4xl"
            style={{ background: "var(--sand-100)" }}
          >
            🗺️
          </div>
          <p className="text-[16px] font-semibold" style={{ color: "var(--nature-900)" }}>
            {isFiltering ? t("itinerary.no_results") : t("itinerary.empty")}
          </p>
          <p className="text-[13px]" style={{ color: "var(--surface-muted)" }}>
            {isFiltering ? t("itinerary.try_remove_filters") : t("itinerary.import_excel")}
          </p>
          {isFiltering ? (
            <button onClick={clearFilters}
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-white"
              style={{ background: "var(--nature-700)" }}>
              {t("itinerary.clear_filters")}
            </button>
          ) : (
            <button onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
              style={{ background: "var(--nature-700)" }}>
              <FileUp className="w-4 h-4" /> {t("itinerary.import_excel")}
            </button>
          )}
        </motion.div>
      )}

      {/* ── TIMELINE ── */}
      <div className="px-5 mt-2">
        {Object.entries(groupedByDay)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([d, dayItems]) => {
            const firstItem = dayItems[0];
            const isFolded = effectiveFoldedDays[d] === true;
            const visitedInDay = dayItems.filter((i) => i.visited).length;

            return (
              <div key={d} className="relative mb-8">
                {/* Timeline vertical line */}
                <div
                  className="absolute left-[15px] top-[40px] bottom-0 w-[2px]"
                  style={{ background: "var(--sand-200)" }}
                />

                {/* Day header */}
                <button
                  type="button"
                  className="relative z-10 w-full flex items-center gap-3 mb-4"
                  onClick={() =>
                    !isFiltering &&
                    setFoldedDays((prev) => ({ ...prev, [d]: !isFolded }))
                  }
                >
                  {/* Day dot */}
                  <div
                    className="w-8 h-8 rounded-full grid place-items-center text-xs font-extrabold flex-shrink-0 shadow-[var(--shadow-sm)]"
                    style={{
                      background: "linear-gradient(135deg,var(--nature-600),var(--nature-800))",
                      color: "#fff",
                    }}
                  >
                    {d}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[14px] font-bold" style={{ color: "var(--nature-900)" }}>
                      {t("itinerary.day")} {d}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--surface-muted)" }}>
                      {firstItem.date} · {visitedInDay}/{dayItems.length} hoạt động
                    </p>
                  </div>
                  {/* Fold badge */}
                  {!isFiltering && (
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background: isFolded ? "var(--sand-200)" : "var(--nature-100)",
                        color: "var(--nature-700)",
                      }}
                    >
                      {isFolded ? t("itinerary.open") : t("itinerary.fold")}
                    </span>
                  )}
                </button>

                {/* Cards */}
                <AnimatePresence initial={false}>
                  {!isFolded && (
                    <motion.div
                      key={`day-${d}-content`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 0.68, 0, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pl-6 space-y-2">
                        {dayItems.map((item, idx) => {
                          const reindexOrders = async (its: typeof dayItems) => {
                            await Promise.all(its.map((it, i) => updateItineraryItem(it.id, { order: i })));
                          };
                          const handleMoveUp = idx > 0 ? async () => {
                            const n = [...dayItems];
                            [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]];
                            await reindexOrders(n);
                          } : undefined;
                          const handleMoveDown = idx < dayItems.length - 1 ? async () => {
                            const n = [...dayItems];
                            [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]];
                            await reindexOrders(n);
                          } : undefined;

                          return (
                            <div
                              key={item.id}
                              ref={(el) => { cardRefs.current[item.id] = el; }}
                              id={`itinerary-${item.id}`}
                            >
                              <ItineraryCard
                                item={item}
                                index={idx}
                                defaultExpanded={expandId === item.id}
                                highlighted={expandId === item.id}
                                onToggleVisited={toggleVisited}
                                onMoveUp={handleMoveUp}
                                onMoveDown={handleMoveDown}
                              />
                            </div>
                          );
                        })}

                        {/* Add activity */}
                        {canEdit && (
                          <button
                            onClick={() =>
                              setCreateModal({ day: Number(d), date: firstItem.date, order: dayItems.length })
                            }
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-[20px] text-[13px] font-semibold transition-colors"
                            style={{
                              background: "var(--sand-100)",
                              color: "var(--nature-700)",
                              border: "1.5px dashed var(--sand-400)",
                            }}
                          >
                            <Plus className="w-4 h-4" />
                            {t("itinerary.add_activity")}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

        {createModal && (
          <CreateItemModal
            day={createModal.day}
            date={createModal.date}
            order={createModal.order}
            existingItems={groupedByDay[createModal.day] ?? []}
            onClose={() => setCreateModal(null)}
          />
        )}
      </div>

      {showImport && (
        <ImportDialog tripId={tripId} onClose={() => setShowImport(false)} />
      )}

      {showShare && trip && (
        <ShareModal trip={trip} onClose={() => setShowShare(false)} />
      )}

      <ConfirmModal
        isOpen={showDeleteAll}
        title={t("itinerary.delete_all_confirm")}
        message={t("itinerary.delete_all_message", { count: items.length })}
        confirmText={deleting ? t("common.loading") : t("itinerary.delete_all")}
        cancelText={t("itinerary.delete_cancel")}
        variant="destructive"
        onConfirm={handleDeleteAll}
        onCancel={() => setShowDeleteAll(false)}
      />
    </div>
  );
}
