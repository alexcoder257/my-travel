"use client";

import { useTripData } from "@/contexts/TripDataContext";

export function useItinerary() {
  const { items, itineraryLoading: loading, toggleVisited } = useTripData();
  return { items, loading, error: null, toggleVisited };
}
