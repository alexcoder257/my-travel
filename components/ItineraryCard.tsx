"use client";

import { ItineraryItem } from "@/types/index";
import {
  Check,
  MapPin,
  ChevronDown,
  ChevronUp,
  Clock,
  NotebookPen,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  addVisitedPlace,
  deleteVisitedPlace,
  deleteItineraryItem,
  updateItineraryItem,
  updateVisitedPlace,
} from "@/lib/firestore";
import { useTripData } from "@/contexts/TripDataContext";
import { ConfirmModal } from "./ConfirmModal";
import { EditItemModal } from "./EditItemModal";
import { useToast } from "@/contexts/ToastContext";
import { useTranslation } from "@/lib/i18n";

interface ItineraryCardProps {
  item: ItineraryItem;
  index?: number;
  defaultExpanded?: boolean;
  highlighted?: boolean;
  onToggleVisited: (itemId: string, visited: boolean) => void;
  onDeleted?: (itemId: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function ItineraryCard({
  item,
  index = 0,
  defaultExpanded = false,
  highlighted = false,
  onToggleVisited,
  onDeleted,
  onMoveUp,
  onMoveDown,
}: ItineraryCardProps) {
  const toast = useToast();
  const { t } = useTranslation();
  const { visitedPlaces } = useTripData();

  const CATEGORY_META: Record<
    string,
    { emoji: string; tint: string; label: string }
  > = {
    food: { emoji: "🍜", tint: "linear-gradient(135deg,#fff3d6,#ffd98a)", label: t("card.food") },
    place: { emoji: "📍", tint: "linear-gradient(135deg,#e7f1e2,#b8dbb0)", label: "Địa điểm" },
    transport: { emoji: "🚌", tint: "linear-gradient(135deg,#e0ecff,#b8cdff)", label: t("card.transport") },
    other: { emoji: "✦", tint: "linear-gradient(135deg,#f1e7ff,#d7c1ff)", label: "Khác" },
  };

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isHighlighted, setIsHighlighted] = useState(highlighted);

  useEffect(() => {
    if (defaultExpanded) {
      setIsExpanded(true);
    }
  }, [defaultExpanded]);

  useEffect(() => {
    if (highlighted) {
      setIsHighlighted(true);
      const timer = setTimeout(() => setIsHighlighted(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlighted]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const visitedPlace = visitedPlaces.find((vp) => vp.itineraryItemId === item.id) ?? null;

  const [foodAmount, setFoodAmount] = useState("");
  const [transportAmount, setTransportAmount] = useState("");
  const [priceCurrency, setPriceCurrency] = useState<"SGD" | "MYR" | "VND">(
    item.estimatedPrice.currency || "SGD"
  );
  const [userNote, setUserNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mapUrl] = useState(item.mapUrl || "");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const visitedPlaceId = visitedPlace?.id ?? null;
  useEffect(() => {
    if (visitedPlace) {
      setFoodAmount(visitedPlace.foodCost?.amount?.toString() || "");
      setTransportAmount(visitedPlace.transportCost?.amount?.toString() || "");
      setPriceCurrency(
        visitedPlace.foodCost?.currency ||
          visitedPlace.transportCost?.currency ||
          item.estimatedPrice.currency ||
          "SGD"
      );
      setUserNote(visitedPlace.notes || "");
    } else {
      setFoodAmount("");
      setTransportAmount("");
      setUserNote("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitedPlaceId]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleDeleteItem = async () => {
    setDeletingItem(true);
    try {
      await deleteItineraryItem(item.id);
      toast.success(t("common.success"));
      onDeleted?.(item.id);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setDeletingItem(false);
      setShowDeleteItemModal(false);
    }
  };

  const handleToggleQuick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.visited) {
      setIsDeleteModalOpen(true);
    } else {
      try {
        setSubmitting(true);
        await addVisitedPlace(item.id, {
          foodCost: {
            amount: foodAmount ? parseFloat(foodAmount) : 0,
            currency: priceCurrency,
          },
          transportCost: {
            amount: transportAmount ? parseFloat(transportAmount) : 0,
            currency: priceCurrency,
          },
          imageUrls: [],
          notes: userNote,
          visitedAt: new Date(),
        });
        onToggleVisited(item.id, true);
      } catch (error) {
        console.error("Failed quick toggle:", error);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleSaveVisit = async () => {
    try {
      setSubmitting(true);
      if (mapUrl !== item.mapUrl) {
        await updateItineraryItem(item.id, { mapUrl });
      }
      await addVisitedPlace(item.id, {
        foodCost: {
          amount: foodAmount ? parseFloat(foodAmount) : 0,
          currency: priceCurrency,
        },
        transportCost: {
          amount: transportAmount ? parseFloat(transportAmount) : 0,
          currency: priceCurrency,
        },
        imageUrls: [],
        notes: userNote,
        visitedAt: new Date(),
      });
      onToggleVisited(item.id, true);
      setIsExpanded(false);
    } catch (error) {
      console.error("Failed to save visit:", error);
      toast.error(t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!visitedPlace) return;
    try {
      setSubmitting(true);
      await updateVisitedPlace(visitedPlace.id, { notes: userNote });
      toast.success(t("common.success"));
    } catch (error) {
      console.error("Failed to update note:", error);
      toast.error(t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteVisit = async () => {
    try {
      setSubmitting(true);
      if (visitedPlace) {
        await deleteVisitedPlace(visitedPlace.id);
      }
      await onToggleVisited(item.id, false);
    } catch (error) {
      console.error("Failed to delete visit:", error);
    } finally {
      setSubmitting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const cat = CATEGORY_META[item.category || "other"] || CATEGORY_META.other;

  return (
    <>
      <motion.article
        layout
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.45, ease: [0.22, 0.68, 0, 1] }}
        className="relative rounded-[22px] overflow-hidden transition-shadow duration-500"
        style={{
          background: item.visited
            ? "var(--surface-card)"
            : index % 2 === 0
            ? "var(--surface-card)"
            : "#EEF4FF",
          boxShadow: isHighlighted
            ? "0 0 0 3px var(--nature-500), 0 6px 24px rgba(54,93,47,0.25)"
            : item.visited
            ? "0 6px 18px rgba(54,93,47,0.14)"
            : "var(--shadow-sm)",
        }}
      >
        {item.visited && (
          <div
            className="absolute inset-y-0 left-0 w-[4px]"
            style={{ background: "var(--nature-500)" }}
          />
        )}

        <div className="px-3 pt-3 pb-0 flex gap-2.5 items-start">
          <button
            type="button"
            onClick={handleToggleQuick}
            disabled={submitting}
            aria-pressed={item.visited}
            aria-label={item.visited ? "Bỏ đánh dấu đã đến" : "Đánh dấu đã đến"}
            className="w-6 h-6 rounded-full grid place-items-center flex-shrink-0 mt-1 transition-transform active:scale-90"
            style={{
              background: item.visited ? "var(--nature-600)" : "transparent",
              border: item.visited
                ? "1px solid var(--nature-600)"
                : "1.5px dashed var(--sand-400)",
            }}
          >
            {item.visited && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </button>

          <div className="flex-1 min-w-0 pb-3">
            <div className="flex items-start justify-between gap-1.5">
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="text-left flex-1 min-w-0 flex items-start gap-2"
              >
                <div
                  className="w-8 h-8 rounded-xl grid place-items-center text-base flex-shrink-0"
                  style={{ background: cat.tint }}
                  aria-hidden
                >
                  {cat.emoji}
                </div>
                <div className="min-w-0 pt-0.5">
                  <h3
                    className={`font-bold text-[14px] leading-snug ${isExpanded ? "whitespace-normal" : "truncate"}`}
                    style={{ color: "var(--nature-900)" }}
                  >
                    {item.activity}
                  </h3>
                  <p
                    className={`text-[12px] mt-0.5 ${isExpanded ? "whitespace-normal" : "truncate"}`}
                    style={{ color: "var(--surface-muted)" }}
                  >
                    {item.location}
                  </p>
                </div>
              </button>

              <div ref={menuRef} className="relative flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
                  aria-label={t("card.details")}
                  className="w-8 h-8 rounded-full grid place-items-center transition-colors"
                  style={{ color: "var(--surface-muted)" }}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-9 z-30 w-36 rounded-2xl overflow-hidden shadow-[var(--shadow-lg)]"
                      style={{ background: "var(--surface-card)" }}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowEditModal(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--sand-100)]"
                        style={{ color: "var(--nature-900)" }}
                      >
                        <Pencil className="w-3.5 h-3.5" /> {t("card.edit")}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowDeleteItemModal(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--sand-100)]"
                        style={{ color: "var(--accent-berry)" }}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {t("card.delete")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-1.5 flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[12px]" style={{ color: "var(--surface-muted)" }}>
              <span className="inline-flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                <span className="font-semibold" style={{ color: "var(--nature-700)" }}>{item.time || "—"}</span>
              </span>
              <span>·</span>
              <span>{item.date}</span>
              <span>·</span>
              <span className="font-semibold" style={{ color: "var(--nature-800)" }}>
                ~{item.estimatedPrice.amount}
                <span className="ml-0.5 opacity-70 text-[11px]">{item.estimatedPrice.currency}</span>
              </span>
            </div>

            {item.mapUrl && (
              <a href={item.mapUrl} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-1.5 inline-flex items-center gap-0.5 text-[12px] font-semibold"
                style={{ color: "var(--nature-600)" }}
              >
                <MapPin className="w-3 h-3" /> {t("card.open_maps")} <ArrowUpRight className="w-2.5 h-2.5" />
              </a>
            )}

            {item.notes && !isExpanded && (
              <p className="mt-1.5 text-[12px] line-clamp-1" style={{ color: "var(--surface-muted)" }}>
                {item.notes}
              </p>
            )}
            {item.visited && visitedPlace?.notes && !isExpanded && (
              <div className="mt-1.5 inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full max-w-full"
                style={{ background: "var(--sand-100)", color: "var(--nature-700)" }}>
                <NotebookPen className="w-3 h-3 flex-shrink-0" />
                <span className="line-clamp-1">{visitedPlace.notes}</span>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                <button onClick={onMoveUp} disabled={!onMoveUp} aria-label="Lên"
                  className="w-7 h-7 rounded-full grid place-items-center disabled:opacity-30"
                  style={{ color: "var(--surface-muted)" }}>
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button onClick={onMoveDown} disabled={!onMoveDown} aria-label="Xuống"
                  className="w-7 h-7 rounded-full grid place-items-center disabled:opacity-30"
                  style={{ color: "var(--surface-muted)" }}>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="text-[12px] font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
                style={{ background: isExpanded ? "var(--nature-100)" : "var(--sand-100)", color: "var(--nature-700)" }}
              >
                {isExpanded ? t("card.collapse") : t("card.details")}
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 0.68, 0, 1] }}
              className="overflow-hidden"
            >
              <div
                className="mx-3 mb-4 pt-4 space-y-4"
                style={{ borderTop: "1px dashed var(--sand-300)" }}
              >
                {item.notes && (
                  <p className="text-[15px] rounded-2xl p-3 leading-relaxed"
                    style={{ background: "var(--sand-100)", color: "var(--nature-800)" }}>
                    {item.notes}
                  </p>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[14px] font-semibold uppercase tracking-wide"
                      style={{ color: "var(--surface-muted)" }}>
                      {t("card.actual_spend")}
                    </label>
                    <select
                      value={priceCurrency}
                      onChange={(e) => setPriceCurrency(e.target.value as "SGD" | "MYR" | "VND")}
                      disabled={item.visited && !!visitedPlace}
                      className="px-2.5 py-1 rounded-full text-[16px] font-semibold outline-none"
                      style={{ background: "var(--sand-100)", color: "var(--nature-800)" }}
                    >
                      <option value="SGD">SGD</option>
                      <option value="MYR">MYR</option>
                      <option value="VND">VND</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <SpendInput label={t("card.food")} value={foodAmount} onChange={setFoodAmount}
                      disabled={item.visited && !!visitedPlace} />
                    <SpendInput label={t("card.transport")} value={transportAmount} onChange={setTransportAmount}
                      disabled={item.visited && !!visitedPlace} />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1 text-[14px] font-semibold uppercase tracking-wide mb-2"
                    style={{ color: "var(--surface-muted)" }}>
                    <NotebookPen className="w-4 h-4" /> {t("card.experience_notes")}
                  </label>
                  <textarea
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="Viết cảm nhận, tip hoặc ghi chú cá nhân…"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-2xl outline-none focus:ring-2 text-[16px] resize-none"
                    style={{ background: "var(--sand-100)", color: "var(--nature-900)" }}
                  />
                </div>

                {!item.visited && (
                  <button onClick={handleSaveVisit} disabled={submitting}
                    className="w-full rounded-full py-3 font-semibold text-sm text-white active:scale-[.98] transition"
                    style={{ background: "var(--nature-700)" }}>
                    {submitting ? t("common.loading") : t("card.mark_visited_save")}
                  </button>
                )}

                {item.visited && visitedPlace && userNote !== (visitedPlace.notes || "") && (
                  <button onClick={handleUpdateNote} disabled={submitting}
                    className="w-full rounded-full py-2.5 text-sm font-semibold"
                    style={{ background: "var(--nature-100)", color: "var(--nature-800)" }}>
                    {submitting ? t("common.loading") : t("card.save_notes")}
                  </button>
                )}

                {item.visited && visitedPlace && (
                  <button onClick={() => setIsDeleteModalOpen(true)}
                    className="w-full rounded-full py-2.5 text-sm font-semibold"
                    style={{ background: "rgba(177,69,82,0.08)", color: "var(--accent-berry)" }}>
                    {t("card.delete_spend")}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Xác nhận bỏ tích"
        message="Bạn có chắc chắn muốn xóa trạng thái đã đến và thông tin chi tiêu của hoạt động này không? Hành động này không thể hoàn tác."
        onConfirm={confirmDeleteVisit}
        onCancel={() => setIsDeleteModalOpen(false)}
        variant="destructive"
        confirmText="Xóa bản ghi"
      />

      <ConfirmModal
        isOpen={showDeleteItemModal}
        title={t("card.delete")}
        message={`Bạn có chắc muốn xóa "${item.activity}" khỏi lịch trình? Hành động này không thể hoàn tác.`}
        onConfirm={handleDeleteItem}
        onCancel={() => setShowDeleteItemModal(false)}
        variant="destructive"
        confirmText={deletingItem ? t("common.loading") : t("card.delete")}
      />

      {showEditModal && (
        <EditItemModal item={item} onClose={() => setShowEditModal(false)} />
      )}
    </>
  );
}

function SpendInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label
        className="text-[13px] mb-1 block"
        style={{ color: "var(--surface-muted)" }}
      >
        {label}
      </label>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        disabled={disabled}
        className="w-full px-3 py-2 rounded-xl outline-none focus:ring-2 text-[16px]"
        style={{
          background: "var(--sand-100)",
          color: "var(--nature-900)",
        }}
      />
    </div>
  );
}
