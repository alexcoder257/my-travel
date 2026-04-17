"use client";

import { useState, useEffect } from "react";
import { ItineraryItem } from "@/types/index";
import {
  getItinerary,
  subscribeToItinerary,
  toggleVisited,
} from "@/lib/firestore";

export function useItinerary() {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToItinerary((data) => {
      setItems(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleVisited = async (itemId: string, visited: boolean) => {
    try {
      await toggleVisited(itemId, visited);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  return { items, loading, error, toggleVisited: handleToggleVisited };
}
