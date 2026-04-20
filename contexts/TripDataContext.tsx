"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Trip, ItineraryItem, VisitedPlace } from "@/types/index";
import {
  getOrCreateTrip,
  subscribeToItinerary,
  subscribeToVisitedPlaces,
  toggleVisited as firestoreToggleVisited,
} from "@/lib/firestore";

interface TripDataContextValue {
  trip: Trip | null;
  tripLoading: boolean;
  items: ItineraryItem[];
  itineraryLoading: boolean;
  visitedPlaces: VisitedPlace[];
  visitedLoading: boolean;
  toggleVisited: (itemId: string, visited: boolean) => Promise<void>;
}

const TripDataContext = createContext<TripDataContextValue | null>(null);

/**
 * Single source of truth for all Firestore real-time data.
 * Mounted once at root layout — listeners never re-open on tab switches.
 */
export function TripDataProvider({ children }: { children: ReactNode }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripLoading, setTripLoading] = useState(true);

  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [itineraryLoading, setItineraryLoading] = useState(true);

  const [visitedPlaces, setVisitedPlaces] = useState<VisitedPlace[]>([]);
  const [visitedLoading, setVisitedLoading] = useState(true);

  // One-time trip fetch
  useEffect(() => {
    getOrCreateTrip()
      .then((t) => { setTrip(t); setTripLoading(false); })
      .catch(() => setTripLoading(false));
  }, []);

  // Single persistent itinerary listener (replaces per-page subscriptions)
  useEffect(() => {
    const unsub = subscribeToItinerary((data) => {
      setItems(data);
      setItineraryLoading(false);
    });
    return () => unsub();
  }, []);

  // Single persistent visited-places listener (replaces 68 per-card subscriptions)
  useEffect(() => {
    const unsub = subscribeToVisitedPlaces((data) => {
      setVisitedPlaces(data);
      setVisitedLoading(false);
    });
    return () => unsub();
  }, []);

  const handleToggleVisited = async (itemId: string, visited: boolean) => {
    await firestoreToggleVisited(itemId, visited);
  };

  return (
    <TripDataContext.Provider
      value={{
        trip,
        tripLoading,
        items,
        itineraryLoading,
        visitedPlaces,
        visitedLoading,
        toggleVisited: handleToggleVisited,
      }}
    >
      {children}
    </TripDataContext.Provider>
  );
}

export function useTripData() {
  const ctx = useContext(TripDataContext);
  if (!ctx) throw new Error("useTripData must be inside TripDataProvider");
  return ctx;
}
