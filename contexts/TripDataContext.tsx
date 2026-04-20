"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useParams } from "next/navigation";
import { Trip, ItineraryItem, VisitedPlace } from "@/types/index";
import { useAuth } from "./AuthContext";
import {
  getTrip,
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
  canEdit: boolean;
  isOwner: boolean;
}

const TripDataContext = createContext<TripDataContextValue | null>(null);

export function TripDataProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const tripId = params?.tripId as string;
  const { user } = useAuth();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripLoading, setTripLoading] = useState(true);

  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [itineraryLoading, setItineraryLoading] = useState(true);

  const [visitedPlaces, setVisitedPlaces] = useState<VisitedPlace[]>([]);
  const [visitedLoading, setVisitedLoading] = useState(true);

  // Determine permissions
  const isOwner = user ? trip?.ownerId === user.uid : false;
  const userRole = user?.email ? trip?.roles?.[user.email.replace(/\./g, "_")] : null;
  const canEdit = isOwner || userRole === "editor";

  // Trip fetch
  useEffect(() => {
    if (!tripId) {
      setTripLoading(false);
      return;
    }

    setTripLoading(true);
    getTrip(tripId)
      .then((t) => {
        setTrip(t);
        setTripLoading(false);
      })
      .catch(() => setTripLoading(false));
  }, [tripId]);

  // Itinerary listener
  useEffect(() => {
    if (!tripId) return;
    const unsub = subscribeToItinerary(tripId, (data) => {
      setItems(data);
      setItineraryLoading(false);
    });
    return () => unsub();
  }, [tripId]);

  // Visited-places listener
  useEffect(() => {
    if (!tripId) return;
    const unsub = subscribeToVisitedPlaces(tripId, (data) => {
      setVisitedPlaces(data);
      setVisitedLoading(false);
    });
    return () => unsub();
  }, [tripId]);

  const handleToggleVisited = async (itemId: string, visited: boolean) => {
    if (!canEdit) return;
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
        canEdit,
        isOwner,
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
