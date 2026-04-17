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
  GripVertical,
  ExternalLink,
  NotebookPen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  addVisitedPlace,
  subscribeToVisitedPlaceByItemId,
  deleteVisitedPlace,
  updateItineraryItem,
  updateVisitedPlace,
} from "@/lib/firestore";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ConfirmModal } from "./ConfirmModal";

interface ItineraryCardProps {
  item: ItineraryItem;
  onToggleVisited: (itemId: string, visited: boolean) => void;
}

export function ItineraryCard({ item, onToggleVisited }: ItineraryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const [visitedPlace, setVisitedPlace] = useState<VisitedPlace | null>(null);
  const [foodAmount, setFoodAmount] = useState("");
  const [transportAmount, setTransportAmount] = useState("");
  const [priceCurrency, setPriceCurrency] = useState<"SGD" | "MYR" | "VND">(
    item.estimatedPrice.currency || "SGD"
  );
  const [userNote, setUserNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mapUrl, setMapUrl] = useState(item.mapUrl || "");
  const [time, setTime] = useState(item.time);
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

  const handleTimeBlur = async () => {
    if (time !== item.time) {
      try {
        await updateItineraryItem(item.id, { time });
      } catch (error) {
        console.error("Failed to update time:", error);
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
      alert("Lưu thất bại");
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
      alert("Cập nhật ghi chú thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMapUrl = async () => {
    try {
      setSubmitting(true);
      await updateItineraryItem(item.id, { mapUrl });
    } catch (error) {
      console.error("Failed to update map URL:", error);
      alert("Cập nhật thất bại");
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

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`p-4 border rounded-lg transition ${
          item.visited ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
        } ${isDragging ? "shadow-lg ring-2 ring-blue-500 z-50" : ""}`}
      >

        <div className="flex gap-0.5 md:gap-2">
          {/* Drag handle — compact on mobile */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 flex items-center pt-1 md:pt-2.5 cursor-grab active:cursor-grabbing touch-none text-gray-300 hover:text-gray-500"
            style={{ minWidth: 32, minHeight: 32 }}
          >
            <GripVertical className="w-3 h-3 md:w-4 md:h-4" />
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
              <div className="text-right flex-shrink-0">
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
            </div>

            {/* Time + Date row */}
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span>{item.date}</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  onBlur={handleTimeBlur}
                  className="w-12 border-none bg-transparent focus:ring-0 p-0 text-xs font-medium text-blue-600"
                />
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

                {/* Google Maps link */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Link Google Maps</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={mapUrl}
                        onChange={(e) => setMapUrl(e.target.value)}
                        placeholder="https://maps.google.com/..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    {item.mapUrl && (
                      <a
                        href={item.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-gray-300 rounded-lg text-blue-600 hover:bg-blue-50"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                    {mapUrl !== item.mapUrl && (
                      <Button onClick={handleUpdateMapUrl} size="sm" variant="outline">
                        Lưu link
                      </Button>
                    )}
                  </div>
                </div>

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
                      <label className="text-xs text-gray-500 mb-1 block">🍜 Ăn uống & tham quan</label>
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
                      <label className="text-xs text-gray-500 mb-1 block">🚗 Đi lại (Grab/MRT)</label>
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
    </>
  );
}
