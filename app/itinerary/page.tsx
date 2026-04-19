"use client";

import { useItinerary } from "@/hooks/useItinerary";
import { ItineraryCard } from "@/components/ItineraryCard";
import { ImportDialog } from "@/components/ImportDialog";
import { Loader, FileUp, Search, X, Trash2 } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { updateItineraryItem, deleteAllItineraryItems } from "@/lib/firestore";
import { ItineraryItem } from "@/types/index";
import { CreateItemModal } from "@/components/CreateItemModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";

type CategoryFilter = "all" | "food" | "place" | "transport" | "other";
type StatusFilter = "all" | "visited" | "unvisited";
type CountryFilter = "all" | "sg" | "my";

// Derive country from item currency
function getCountry(item: ItineraryItem): "sg" | "my" | "both" {
  if (item.estimatedPrice.currency === "SGD") return "sg";
  if (item.estimatedPrice.currency === "MYR") return "my";
  return "both"; // VND / other → show in both country views
}

export default function ItineraryPage() {
  const { items: initialItems, loading, toggleVisited } = useItinerary();
  const toast = useToast();
  const [items, setItems] = useState(initialItems);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const scrollToId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("scrollTo")
      : null;
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasScrolledRef = useRef<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<CountryFilter>("all");
  const [day, setDay] = useState<number | "all">("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const [foldedDays, setFoldedDays] = useState<Record<string, boolean>>({});
  const [showImport, setShowImport] = useState(false);
  // Track which day group is opening the create modal
  const [createModal, setCreateModal] = useState<null | { day: number; date: string; order: number }>(null);

  useEffect(() => { setItems(initialItems); }, [initialItems]);

  useEffect(() => {
    if (scrollToId && cardRefs.current[scrollToId] && hasScrolledRef.current !== scrollToId) {
      setTimeout(() => {
        cardRefs.current[scrollToId]?.scrollIntoView({ behavior: "smooth", block: "center" });
        hasScrolledRef.current = scrollToId;
      }, 300);
    }
  }, [scrollToId, items]);

  const isFiltering =
    search.trim() !== "" || country !== "all" || day !== "all" || category !== "all" || status !== "all";

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      await deleteAllItineraryItems();
      toast.success("Đã xóa toàn bộ lịch trình.");
    } catch {
      toast.error("Xóa thất bại, thử lại.");
    } finally {
      setDeleting(false);
      setShowDeleteAll(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCountry("all");
    setDay("all");
    setCategory("all");
    setStatus("all");
  };

  // Unique sorted days from data
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
        if (c !== "both" && c !== country) return false;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2 md:px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-2 md:px-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Lịch trình</h1>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={() => setShowDeleteAll(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Xóa tất cả
            </button>
          )}
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <FileUp className="w-4 h-4" />
            Import Excel
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="px-2 md:px-0 mb-6 space-y-3">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm hoạt động, địa điểm..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Row: Country + Status */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
          {/* Country */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 font-medium">Quốc gia</span>
            {(["all", "sg", "my"] as CountryFilter[]).map((c) => {
              const label = c === "all" ? "Tất cả" : c === "sg" ? "🇸🇬 Singapore" : "🇲🇾 Malaysia";
              const active = country === c;
              return (
                <button
                  key={c}
                  onClick={() => setCountry(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 font-medium">Trạng thái</span>
            {(["all", "visited", "unvisited"] as StatusFilter[]).map((s) => {
              const label = s === "all" ? "Tất cả" : s === "visited" ? "✓ Đã đến" : "○ Chưa đến";
              const active = status === s;
              const activeClass =
                active
                  ? s === "visited"
                    ? "bg-green-600 text-white"
                    : s === "unvisited"
                    ? "bg-orange-500 text-white"
                    : "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200";
              return (
                <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeClass}`}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row: Days (horizontal scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <span className="text-xs text-gray-400 font-medium shrink-0">Ngày</span>
          <button
            onClick={() => setDay("all")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              day === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tất cả
          </button>
          {allDays.map((d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                day === d ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              N.{d}
            </button>
          ))}
        </div>

        {/* Row: Category + result count + clear */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-400 font-medium">Loại</span>
          {(
            [
              ["all", "Tất cả"],
              ["food", "🍜 Ăn uống"],
              ["place", "📍 Địa điểm"],
              ["transport", "🚌 Di chuyển"],
              ["other", "✦ Khác"],
            ] as [CategoryFilter, string][]
          ).map(([c, label]) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === c ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}

          {isFiltering && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-400">{filteredItems.length} kết quả</span>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium"
              >
                <X className="w-3 h-3" />
                Xóa filter
              </button>
            </div>
          )}
        </div>
      </div>

      {showImport && (
        <ImportDialog tripId="sg-my-2026" onClose={() => setShowImport(false)} />
      )}

      <ConfirmModal
        isOpen={showDeleteAll}
        title="Xóa toàn bộ lịch trình?"
        message={`Sẽ xóa tất cả ${items.length} hoạt động. Không thể hoàn tác.`}
        confirmText={deleting ? "Đang xóa..." : "Xóa tất cả"}
        cancelText="Hủy"
        variant="destructive"
        onConfirm={handleDeleteAll}
        onCancel={() => setShowDeleteAll(false)}
      />

      {/* Empty state */}
      {Object.keys(groupedByDay).length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Không tìm thấy hoạt động nào</p>
          <button onClick={clearFilters} className="mt-2 text-sm text-blue-500 hover:underline">
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Day groups */}
      <div className="space-y-8">
        {Object.entries(groupedByDay)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([d, dayItems]) => {
            const firstItem = dayItems[0];
            const isFolded = effectiveFoldedDays[d] === true;
            return (
              <div key={d}>
                <div
                  className="mb-4 pb-3 border-b-2 border-blue-200 px-2 md:px-0 cursor-pointer select-none flex items-center justify-between"
                  onClick={() => !isFiltering && setFoldedDays((prev) => ({ ...prev, [d]: !isFolded }))}
                >
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Ngày {d}</h2>
                    <p className="text-gray-500 text-sm">{firstItem.date}</p>
                  </div>
                  {!isFiltering && (
                    <span className="ml-2">
                      {isFolded
                        ? <ChevronRight className="w-7 h-7 text-blue-600" />
                        : <ChevronDown className="w-7 h-7 text-blue-600" />}
                    </span>
                  )}
                </div>

                {!isFolded && (
                  <div className="space-y-3 px-2 md:px-0">
                    {dayItems.map((item, idx) => {
                      // Move handler: after swap, reindex all orders for the day
                      const reindexOrders = async (items: typeof dayItems) => {
                        await Promise.all(
                          items.map((it, i) => updateItineraryItem(it.id, { order: i }))
                        );
                      };
                      const handleMoveUp = idx > 0 ? async () => {
                        // Swap in array
                        const newItems = [...dayItems];
                        [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
                        await reindexOrders(newItems);
                      } : undefined;
                      const handleMoveDown = idx < dayItems.length - 1 ? async () => {
                        const newItems = [...dayItems];
                        [newItems[idx], newItems[idx + 1]] = [newItems[idx + 1], newItems[idx]];
                        await reindexOrders(newItems);
                      } : undefined;
                      return (
                        <div key={item.id} ref={(el) => { cardRefs.current[item.id] = el; }} id={`itinerary-${item.id}`}>
                          <ItineraryCard
                            item={item}
                            onToggleVisited={toggleVisited}
                            onMoveUp={handleMoveUp}
                            onMoveDown={handleMoveDown}
                          />
                        </div>
                      );
                    })}
                    {/* Add Activity Button */}
                    <div className="pt-2 flex justify-center">
                      <button
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow transition-colors"
                        onClick={() => setCreateModal({ day: Number(d), date: firstItem.date, order: dayItems.length })}
                      >
                        + Thêm hoạt động
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
            {/* Create Item Modal */}
            {createModal && (
              <CreateItemModal
                day={createModal.day}
                date={createModal.date}
                order={createModal.order}
                onClose={() => setCreateModal(null)}
              />
            )}
      </div>
    </div>
  );
}
