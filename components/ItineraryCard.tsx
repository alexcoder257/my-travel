"use client";

import { ItineraryItem, VisitedPlace } from "@/types/index";
import {
  CheckCircle2,
  Circle,
  MapPin,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Clock,
  NotebookPen,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import {
  addVisitedPlace,
  subscribeToVisitedPlaceByItemId,
  deleteVisitedPlace,
  deleteItineraryItem,
  updateItineraryItem,
  updateVisitedPlace,
} from "@/lib/firestore";
import { ConfirmModal } from "./ConfirmModal";
import { EditItemModal } from "./EditItemModal";
import { useToast } from "@/contexts/ToastContext";

interface ItineraryCardProps {
  item: ItineraryItem;
  onToggleVisited: (itemId: string, visited: boolean) => void;
  onDeleted?: (itemId: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function ItineraryCard({ item, onToggleVisited, onDeleted, onMoveUp, onMoveDown }: ItineraryCardProps) {


  const toast = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [visitedPlace, setVisitedPlace] = useState<VisitedPlace | null>(null);
  const [foodAmount, setFoodAmount] = useState("");
  const [transportAmount, setTransportAmount] = useState("");
  const [priceCurrency, setPriceCurrency] = useState<"SGD" | "MYR" | "VND">(
    item.estimatedPrice.currency || "SGD"
  );
  const [userNote, setUserNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Removed unused setMapUrl, setTime
  const [mapUrl] = useState(item.mapUrl || "");
  const [time] = useState(item.time);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToVisitedPlaceByItemId(item.id, (place) => {
      setVisitedPlace(place);
      if (place) {
        setFoodAmount(place.foodCost?.amount?.toString() || "");
        setTransportAmount(place.transportCost?.amount?.toString() || "");
        setPriceCurrency(
          place.foodCost?.currency || place.transportCost?.currency || item.estimatedPrice.currency || "SGD"
        );
        setUserNote(place.notes || "");
      } else {
        setFoodAmount("");
        setTransportAmount("");
        setUserNote("");
      }
    });
    return () => unsubscribe();
  }, [item.id]);
  useEffect(() => {
    const unsubscribe = subscribeToVisitedPlaceByItemId(item.id, (place) => {
      setVisitedPlace(place);
      if (place) {
        setFoodAmount(place.foodCost?.amount?.toString() || "");
        setTransportAmount(place.transportCost?.amount?.toString() || "");
        setPriceCurrency(
          place.foodCost?.currency || place.transportCost?.currency || item.estimatedPrice.currency || "SGD"
        );
        setUserNote(place.notes || "");
      } else {
        setFoodAmount("");
        setTransportAmount("");
        setUserNote("");
      }
    });
    return () => unsubscribe();
  }, [item.id, item.estimatedPrice.currency]);

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
      toast.success("Đã xóa hoạt động.");
      onDeleted?.(item.id);
    } catch {
      toast.error("Xóa thất bại, vui lòng thử lại.");
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
          foodCost: { amount: foodAmount ? parseFloat(foodAmount) : 0, currency: priceCurrency },
          transportCost: { amount: transportAmount ? parseFloat(transportAmount) : 0, currency: priceCurrency },
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

  // Removed unused handleTimeBlur

  const handleSaveVisit = async () => {
    try {
      setSubmitting(true);
      if (mapUrl !== item.mapUrl) {
        await updateItineraryItem(item.id, { mapUrl });
      }
      await addVisitedPlace(item.id, {
        foodCost: { amount: foodAmount ? parseFloat(foodAmount) : 0, currency: priceCurrency },
        transportCost: { amount: transportAmount ? parseFloat(transportAmount) : 0, currency: priceCurrency },
        imageUrls: [],
        notes: userNote,
        visitedAt: new Date(),
      });
      onToggleVisited(item.id, true);
      setIsExpanded(false);
    } catch (error) {
      console.error("Failed to save visit:", error);
      toast.error("Lưu thất bại, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!visitedPlace) return;
    try {
      setSubmitting(true);
      await updateVisitedPlace(visitedPlace.id, { notes: userNote });
    } catch (error) {
      console.error("Failed to update note:", error);
      toast.error("Cập nhật ghi chú thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  // Removed unused handleUpdateMapUrl

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

  return (
    <>
      <div
        className={`p-4 border rounded-lg transition ${
          item.visited ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
        }`}
      >

        <div className="flex gap-0.5 md:gap-2 items-center">
          {/* Up/Down controls */}
          <div className="flex flex-col mr-1">
            <button
              className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
              onClick={onMoveUp}
              disabled={!onMoveUp}
              title="Di chuyển lên"
              type="button"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
              onClick={onMoveDown}
              disabled={!onMoveDown}
              title="Di chuyển xuống"
              type="button"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>


          {/* Check button — visually compact, touch area preserved */}
          <button
            type="button"
            onClick={handleToggleQuick}
            disabled={submitting}
            className="flex-shrink-0 p-1 md:p-2.5 hover:scale-110 transition-transform disabled:opacity-50 flex items-center justify-center"
            style={{ minWidth: 32, minHeight: 32 }}
          >
            {item.visited ? (
              <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            ) : (
              <Circle className="w-5 h-5 md:w-6 md:h-6 text-gray-300" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div onClick={() => setIsExpanded(!isExpanded)} className="cursor-pointer flex-1">
                <h3 className="font-semibold text-gray-900">{item.activity}</h3>
                <p className="text-sm text-gray-600">{item.location}</p>
                {item.mapUrl && (
                  <a
                    href={item.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MapPin className="w-3 h-3" />
                    Xem trên Google Maps
                  </a>
                )}
              </div>
              <div className="flex items-start gap-1 flex-shrink-0">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">
                    ~{item.estimatedPrice.amount}
                    <span className="text-xs ml-1">{item.estimatedPrice.currency}</span>
                  </p>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-400 hover:text-gray-600 mt-1"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Kebab menu */}
                <div ref={menuRef} className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
                    className="p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-7 z-50 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowEditModal(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-blue-500" />
                        Sửa
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowDeleteItemModal(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Time + Date row */}
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span>{item.date}</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-medium text-blue-600">{item.time}</span>
              </div>
            </div>

            {/* Notes preview (collapsed) */}
            {item.notes && !isExpanded && (
              <p className="mt-2 text-xs text-gray-500 line-clamp-1">{item.notes}</p>
            )}

            {/* Experience note badge */}
            {item.visited && visitedPlace?.notes && !isExpanded && (
              <div className="mt-1 flex items-center gap-1 text-xs text-indigo-600">
                <NotebookPen className="w-3 h-3" />
                <span className="line-clamp-1">{visitedPlace.notes}</span>
              </div>
            )}


            {/* Expanded panel */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                {/* Full notes (itinerary guide) */}
                {item.notes && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded p-2 leading-relaxed">{item.notes}</p>
                )}

                {/* Actual spend */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Chi tiêu thực tế</label>
                    <select
                      value={priceCurrency}
                      onChange={(e) => setPriceCurrency(e.target.value as any)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      disabled={item.visited && !!visitedPlace}
                    >
                      <option value="SGD">SGD</option>
                      <option value="MYR">MYR</option>
                      <option value="VND">VND</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">🍜 Ăn uống</label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={foodAmount}
                          onChange={(e) => setFoodAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          disabled={item.visited && !!visitedPlace}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">🚗 Di chuyển</label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={transportAmount}
                          onChange={(e) => setTransportAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          disabled={item.visited && !!visitedPlace}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Experience note */}
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                    <NotebookPen className="w-4 h-4 text-indigo-500" />
                    Ghi chú trải nghiệm
                  </label>
                  <textarea
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="Viết cảm nhận, tip hoặc ghi chú cá nhân về địa điểm này..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm resize-none"
                  />
                </div>

                {/* Action buttons */}
                {!item.visited && (
                  <Button onClick={handleSaveVisit} disabled={submitting} className="w-full mt-2 py-3 min-h-[44px]">
                    {submitting ? "Đang lưu..." : "Đánh dấu đã đến & Lưu chi tiêu"}
                  </Button>
                )}

                {item.visited && visitedPlace && userNote !== (visitedPlace.notes || "") && (
                  <Button
                    onClick={handleUpdateNote}
                    disabled={submitting}
                    variant="outline"
                    className="w-full mt-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  >
                    {submitting ? "Đang lưu..." : "Lưu ghi chú"}
                  </Button>
                )}

                {item.visited && visitedPlace && (
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="w-full mt-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Xóa thông tin chi tiêu
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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
        title="Xóa hoạt động"
        message={`Bạn có chắc muốn xóa "${item.activity}" khỏi lịch trình? Hành động này không thể hoàn tác.`}
        onConfirm={handleDeleteItem}
        onCancel={() => setShowDeleteItemModal(false)}
        variant="destructive"
        confirmText={deletingItem ? "Đang xóa..." : "Xóa hoạt động"}
      />

      {showEditModal && (
        <EditItemModal item={item} onClose={() => setShowEditModal(false)} />
      )}
    </>
  );
}
