"use client";

import { useState, useEffect } from "react";
import { useItinerary } from "@/hooks/useItinerary";
import {
  addVisitedPlace,
  deleteVisitedPlace,
  subscribeToVisitedPlaces,
} from "@/lib/firestore";
import { VisitedPlace, ItineraryItem } from "@/types/index";
import { PhotoUpload } from "@/components/PhotoUpload";
import { Button } from "@/components/ui/button";
import { Loader, X, ChevronDown, ChevronUp } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function ChecklistPage() {
  const { items: itinerary, loading: itineraryLoading } = useItinerary();
  const [visitedPlaces, setVisitedPlaces] = useState<VisitedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [actualPrice, setActualPrice] = useState("");
  const [priceCurrency, setPriceCurrency] = useState<"SGD" | "MYR" | "VND">("SGD");
  const [notes, setNotes] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [filterDay, setFilterDay] = useState<string>("all");
  const [filterPlace, setFilterPlace] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);

  // Modal state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; placeId: string }>({
    isOpen: false,
    placeId: "",
  });

  useEffect(() => {
    const unsubscribe = subscribeToVisitedPlaces((places) => {
      setVisitedPlaces(places);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const unvisitedItems = itinerary.filter((item) => !item.visited);
  const visitedMapByItemId = visitedPlaces.reduce(
    (acc, place) => {
      if (!acc[place.itineraryItemId]) {
        acc[place.itineraryItemId] = [];
      }
      acc[place.itineraryItemId].push(place);
      return acc;
    },
    {} as Record<string, VisitedPlace[]>
  );

  // Get unique days for filter
  const uniqueDays = Array.from(new Set(itinerary.map((item) => item.day))).sort(
    (a, b) => a - b
  );

  // Filter items
  const filteredItems = itinerary.filter((item) => {
    const dayMatch = filterDay === "all" || item.day.toString() === filterDay;
    const placeMatch =
      filterPlace === "all" || item.estimatedPrice.currency === filterPlace;
    return dayMatch && placeMatch;
  });

  const handleAddVisited = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !actualPrice) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setSubmitting(true);
      await addVisitedPlace(selectedItem.id, {
        foodCost: { amount: parseFloat(actualPrice), currency: priceCurrency },
        transportCost: { amount: 0, currency: priceCurrency },
        imageUrls: uploadedPhotos,
        notes,
        visitedAt: new Date(),
      });

      setSelectedItem(null);
      setActualPrice("");
      setNotes("");
      setUploadedPhotos([]);
      setPriceCurrency("SGD");
      setFormOpen(false);
    } catch (error) {
      console.error("Failed to add visited place:", error);
      alert("Lưu địa điểm thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (placeId: string) => {
    setDeleteModal({ isOpen: true, placeId });
  };

  const confirmDelete = async () => {
    try {
      await deleteVisitedPlace(deleteModal.placeId);
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeleteModal({ isOpen: false, placeId: "" });
    }
  };

  if (loading || itineraryLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const addForm = (
    <form onSubmit={handleAddVisited} className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-lg font-semibold">Thêm địa điểm đã đến</h2>

      <div>
        <label className="block text-sm font-medium mb-2">Hoạt động</label>
        <select
          value={selectedItem?.id || ""}
          onChange={(e) => {
            const item = itinerary.find((i) => i.id === e.target.value);
            setSelectedItem(item || null);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Chọn hoạt động</option>
          {unvisitedItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.activity} - {item.location}
            </option>
          ))}
        </select>
      </div>

      {selectedItem && (
        <>
          <PhotoUpload
            placeId={selectedItem.id}
            onPhotoUploaded={(url) => {
              setUploadedPhotos([...uploadedPhotos, url]);
            }}
            isLoading={submitting}
          />

          <div>
            <label className="text-sm font-medium">Giá thực tế</label>
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                step="0.01"
                value={actualPrice}
                onChange={(e) => setActualPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={priceCurrency}
                onChange={(e) => setPriceCurrency(e.target.value as "SGD" | "MYR" | "VND")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SGD">SGD</option>
                <option value="MYR">MYR</option>
                <option value="VND">VND</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ghi chú</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thêm ghi chú về lần đến này..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {uploadedPhotos.length > 0 && (
            <div className="text-sm text-green-600">
              ✓ {uploadedPhotos.length} ảnh đã chọn
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full min-h-[44px]">
            {submitting ? "Đang lưu..." : "Lưu địa điểm"}
          </Button>
        </>
      )}
    </form>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Danh sách đã đến</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 md:gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Theo ngày</label>
          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Tất cả ngày</option>
            {uniqueDays.map((day) => (
              <option key={day} value={day.toString()}>
                Ngày {day}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Theo địa điểm</label>
          <select
            value={filterPlace}
            onChange={(e) => setFilterPlace(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Tất cả địa điểm</option>
            <option value="SGD">Singapore</option>
            <option value="MYR">Malaysia</option>
          </select>
        </div>
      </div>

      {/* Mobile: collapsible add form toggle */}
      <div className="md:hidden mb-4">
        <button
          type="button"
          onClick={() => setFormOpen(!formOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium min-h-[44px]"
        >
          <span>➕ Thêm địa điểm đã đến</span>
          {formOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {formOpen && <div className="mt-3">{addForm}</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Form — desktop sticky sidebar */}
        <div className="hidden md:block lg:col-span-1">
          <div className="sticky top-24">
            {addForm}
          </div>
        </div>

        {/* Visited Places List */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const visited = visitedMapByItemId[item.id];
              return (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1 pr-3">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {item.activity}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">{item.location}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.date} lúc {item.time}
                      </p>
                    </div>
                    {visited && visited.length > 0 && (
                      <span className="flex-shrink-0 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        ✓ Đã đến
                      </span>
                    )}
                  </div>

                  {visited && visited.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {visited.map((place) => (
                        <div
                          key={place.id}
                          className="bg-gray-50 p-3 rounded border border-gray-200"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {(place.foodCost?.amount || 0) + (place.transportCost?.amount || 0)}{" "}
                                {place.foodCost?.currency || place.transportCost?.currency}
                              </p>
                              {place.notes && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {place.notes}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {place.visitedAt.toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteClick(place.id)}
                              className="text-red-600 hover:text-red-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {place.imageUrls && place.imageUrls.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {place.imageUrls.map((url, idx) => (
                                <img
                                  key={idx}
                                  src={url}
                                  alt={`Photo ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-gray-500">
                      Chưa đến
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa bản ghi địa điểm này không? Hành động này không thể hoàn tác."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, placeId: "" })}
        variant="destructive"
        confirmText="Xóa bản ghi"
      />
    </div>
  );
}
