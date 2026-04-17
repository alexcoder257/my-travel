"use client";

import { useState, useEffect } from "react";
import { Trip } from "@/types/index";
import { getOrCreateTrip } from "@/lib/firestore";

export function useTrip() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrip = async () => {
      try {
        setLoading(true);
        const tripData = await getOrCreateTrip();
        setTrip(tripData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trip");
      } finally {
        setLoading(false);
      }
    };

    loadTrip();
  }, []);

  return { trip, loading, error };
}
