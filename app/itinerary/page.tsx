"use client";

import { useItinerary } from "@/hooks/useItinerary";
import { ItineraryCard } from "@/components/ItineraryCard";
import { Loader } from "lucide-react";
import { useMemo } from "react";

export default function ItineraryPage() {
  const { items, loading, toggleVisited } = useItinerary();

  const groupedByDay = useMemo(() => {
    const grouped = items.reduce(
      (acc, item) => {
        if (!acc[item.day]) {
          acc[item.day] = [];
        }
        acc[item.day].push(item);
        return acc;
      },
      {} as Record<number, typeof items>
    );
    return grouped;
  }, [items]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Itinerary</h1>

      <div className="space-y-8">
        {Object.entries(groupedByDay)
          .sort(([dayA], [dayB]) => Number(dayA) - Number(dayB))
          .map(([day, dayItems]) => {
            const firstItem = dayItems[0];
            return (
              <div key={day}>
                <div className="mb-4 pb-3 border-b-2 border-blue-200">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Day {day}
                  </h2>
                  <p className="text-gray-600">{firstItem.date}</p>
                </div>

                <div className="space-y-3">
                  {dayItems.map((item) => (
                    <ItineraryCard
                      key={item.id}
                      item={item}
                      onToggleVisited={toggleVisited}
                    />
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
