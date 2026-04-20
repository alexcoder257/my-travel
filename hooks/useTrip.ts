"use client";

import { useTripData } from "@/contexts/TripDataContext";

export function useTrip() {
  const { trip, tripLoading: loading } = useTripData();
  return { trip, loading, error: null };
}
