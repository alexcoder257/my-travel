"use client";

import { ItineraryItem } from "@/types/index";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ItineraryCardProps {
  item: ItineraryItem;
  onToggleVisited: (itemId: string, visited: boolean) => void;
}

export function ItineraryCard({ item, onToggleVisited }: ItineraryCardProps) {
  return (
    <div
      className={`p-4 border rounded-lg transition ${
        item.visited
          ? "bg-green-50 border-green-200"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex gap-3">
        <button
          onClick={() => onToggleVisited(item.id, !item.visited)}
          className="mt-1 flex-shrink-0"
        >
          {item.visited ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : (
            <Circle className="w-6 h-6 text-gray-300" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">{item.activity}</h3>
              <p className="text-sm text-gray-600">{item.location}</p>
            </div>
            <div className="text-right flex-shrink-0">
              {item.estimatedPrice.currency && (
                <p className="text-sm font-medium text-gray-700">
                  ~{item.estimatedPrice.amount}
                  <span className="text-xs ml-1">{item.estimatedPrice.currency}</span>
                </p>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span>{item.date}</span>
            <span>•</span>
            <span>{item.time}</span>
          </div>

          {item.notes && (
            <p className="mt-2 text-sm text-gray-600">{item.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
