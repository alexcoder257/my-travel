"use client";

import { useItinerary } from "@/hooks/useItinerary";
import { ItineraryCard } from "@/components/ItineraryCard";
import { Loader } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { updateItineraryItem } from "@/lib/firestore";

export default function ItineraryPage() {
  const { items: initialItems, loading, toggleVisited } = useItinerary();
  const [items, setItems] = useState(initialItems);
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const scrollToId = searchParams?.get("scrollTo");
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasScrolledRef = useRef<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Scroll to activity if scrollTo param exists, only once per scrollToId
  useEffect(() => {
    if (
      scrollToId &&
      cardRefs.current[scrollToId] &&
      hasScrolledRef.current !== scrollToId
    ) {
      setTimeout(() => {
        cardRefs.current[scrollToId]?.scrollIntoView({ behavior: "smooth", block: "center" });
        hasScrolledRef.current = scrollToId;
      }, 300);
    }
  }, [scrollToId, items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent, day: number) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const dayItems = items.filter((item) => item.day === day);
      const oldIndex = dayItems.findIndex((item) => item.id === active.id);
      const newIndex = dayItems.findIndex((item) => item.id === over.id);

      const newDayItems = arrayMove(dayItems, oldIndex, newIndex);

      // Update local state immediately
      const newItems = items.map((item) => {
        if (item.day === day) {
          const newItemIndex = newDayItems.findIndex((ni) => ni.id === item.id);
          return { ...item, order: newItemIndex };
        }
        return item;
      });
      setItems(newItems);

      // Update Firestore
      try {
        await Promise.all(
          newDayItems.map((item, index) =>
            updateItineraryItem(item.id, { order: index })
          )
        );
      } catch (error) {
        console.error("Failed to update order:", error);
      }
    }
  };

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

    // Sort items within each day by order
    Object.keys(grouped).forEach((day) => {
      grouped[Number(day)].sort((a, b) => a.order - b.order);
    });

    return grouped;
  }, [items]);

  // State for fold/unfold days
  const [foldedDays, setFoldedDays] = useState<Record<string, boolean>>({});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2 md:px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 px-2 md:px-0">Lịch trình</h1>

      <div className="space-y-8">
        {Object.entries(groupedByDay)
          .sort(([dayA], [dayB]) => Number(dayA) - Number(dayB))
          .map(([day, dayItems]) => {
            const firstItem = dayItems[0];
            const isFolded = foldedDays[day] === true;
            return (
              <div key={day}>
                <div
                  className="mb-4 pb-3 border-b-2 border-blue-200 px-2 md:px-0 cursor-pointer select-none flex items-center justify-between"
                  onClick={() => setFoldedDays((prev) => ({ ...prev, [day]: !isFolded }))}
                >
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                      Ngày {day}
                    </h2>
                    <p className="text-gray-600">{firstItem.date}</p>
                  </div>
                  <span className="ml-2 flex items-center">
                    {isFolded ? (
                      <ChevronRight className="w-7 h-7 text-blue-600" />
                    ) : (
                      <ChevronDown className="w-7 h-7 text-blue-600" />
                    )}
                  </span>
                </div>

                {!isFolded && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, Number(day))}
                  >
                    <SortableContext
                      items={dayItems.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3 px-2 md:px-0">
                        {dayItems.map((item) => (
                          <div
                            key={item.id}
                            ref={el => { cardRefs.current[item.id] = el; }}
                            id={`itinerary-${item.id}`}
                          >
                            <ItineraryCard
                              item={item}
                              onToggleVisited={toggleVisited}
                            />
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
