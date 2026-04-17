"use client";

import { useState, useEffect, useMemo } from "react";
import { VisitedPlace, Trip, ItineraryItem } from "@/types/index";
import { subscribeToVisitedPlaces, getItinerary } from "@/lib/firestore";

export function useExpenses(trip: Trip | null) {
  const [visitedPlaces, setVisitedPlaces] = useState<VisitedPlace[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToVisitedPlaces((data) => {
      setVisitedPlaces(data);
      setLoading(false);
    });
    getItinerary().then(setItinerary);
    return () => unsubscribe();
  }, []);

  const summary = useMemo(() => {
    if (!trip) return null;

    const estimatedSGD = itinerary
      .filter((i) => i.estimatedPrice.currency === "SGD")
      .reduce((s, i) => s + i.estimatedPrice.amount, 0);
    const estimatedMYR = itinerary
      .filter((i) => i.estimatedPrice.currency === "MYR")
      .reduce((s, i) => s + i.estimatedPrice.amount, 0);

    const sum = (places: VisitedPlace[], field: "foodCost" | "transportCost", cur: string) =>
      places.filter((vp) => vp[field]?.currency === cur).reduce((s, vp) => s + (vp[field]?.amount || 0), 0);

    const foodSGD = sum(visitedPlaces, "foodCost", "SGD");
    const foodMYR = sum(visitedPlaces, "foodCost", "MYR");
    const transportSGD = sum(visitedPlaces, "transportCost", "SGD");
    const transportMYR = sum(visitedPlaces, "transportCost", "MYR");

    const totalSGD = foodSGD + transportSGD;
    const totalMYR = foodMYR + transportMYR;

    const toVND = (sgd: number, myr: number) =>
      sgd * trip.exchangeRates.SGD + myr * trip.exchangeRates.MYR;

    return {
      estimated: { SGD: estimatedSGD, MYR: estimatedMYR, VND: toVND(estimatedSGD, estimatedMYR) },
      food: { SGD: foodSGD, MYR: foodMYR, VND: toVND(foodSGD, foodMYR) },
      transport: { SGD: transportSGD, MYR: transportMYR, VND: toVND(transportSGD, transportMYR) },
      actual: { SGD: totalSGD, MYR: totalMYR, VND: toVND(totalSGD, totalMYR) },
      remaining: {
        SGD: trip.budget.SGD - totalSGD,
        MYR: trip.budget.MYR - totalMYR,
      },
    };
  }, [visitedPlaces, itinerary, trip]);

  return { loading, summary, visitedPlaces };
}
