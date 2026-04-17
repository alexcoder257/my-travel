"use client";

import { useState } from "react";
import { useItinerary } from "@/hooks/useItinerary";
import {
  getVisitedPlaces,
  addVisitedPlace,
  deleteVisitedPlace,
  subscribeToVisitedPlaces,
} from "@/lib/firestore";
import { VisitedPlace, ItineraryItem } from "@/types/index";
import { PhotoUpload } from "@/components/PhotoUpload";
import { Button } from "@/components/ui/button";
import { Loader, X, Edit2 } from "lucide-react";
import { useEffect } from "react";

export default function ChecklistPage() {
  const { items: itinerary, loading: itineraryLoading } = useItinerary();
  const [visitedPlaces, setVisitedPlaces] = useState<VisitedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [actualPrice, setActualPrice] = useState("");
  const [priceCurrency, setPriceCurrency] = useState<"SGD" | "MYR" | "VND">(
    "SGD"
  );
  const [notes, setNotes] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

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

  const handleAddVisited = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !actualPrice || uploadedPhotos.length === 0) {
      alert("Please fill all fields and add at least one photo");
      return;
    }

    try {
      setSubmitting(true);
      await addVisitedPlace(selectedItem.id, {
        actualPrice: {
          amount: parseFloat(actualPrice),
          currency: priceCurrency,
        },
        imageUrls: uploadedPhotos,
        notes,
        visitedAt: new Date(),
      });

      setSelectedItem(null);
      setActualPrice("");
      setNotes("");
      setUploadedPhotos([]);
      setPriceCurrency("SGD");
    } catch (error) {
      console.error("Failed to add visited place:", error);
      alert("Failed to save visited place");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVisited = async (placeId: string) => {
    if (confirm("Delete this visited place record?")) {
      try {
        await deleteVisitedPlace(placeId);
      } catch (error) {
        console.error("Failed to delete:", error);
      }
    }
  };

  if (loading || itineraryLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Visited Places</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleAddVisited} className="space-y-4 p-4 border rounded-lg sticky top-24">
            <h2 className="text-lg font-semibold">Add Visited Place</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Activity</label>
              <select
                value={selectedItem?.id || ""}
                onChange={(e) => {
                  const item = itinerary.find((i) => i.id === e.target.value);
                  setSelectedItem(item || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an activity</option>
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
                  <label className="text-sm font-medium">Actual Price</label>
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
                      onChange={(e) => setPriceCurrency(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="SGD">SGD</option>
                      <option value="MYR">MYR</option>
                      <option value="VND">VND</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this visit..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                {uploadedPhotos.length > 0 && (
                  <div className="text-sm text-green-600">
                    ✓ {uploadedPhotos.length} photo(s) selected
                  </div>
                )}

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Saving..." : "Save Visited Place"}
                </Button>
              </>
            )}
          </form>
        </div>

        {/* Visited Places List */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {itinerary.map((item) => {
              const visited = visitedMapByItemId[item.id];
              return (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.activity}
                      </h3>
                      <p className="text-sm text-gray-600">{item.location}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.date} at {item.time}
                      </p>
                    </div>
                    {visited && visited.length > 0 && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium">
                        ✓ Visited
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
                                {place.actualPrice.amount}{" "}
                                {place.actualPrice.currency}
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
                              onClick={() => handleDeleteVisited(place.id)}
                              className="text-red-600 hover:text-red-700"
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
                      Not visited yet
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
