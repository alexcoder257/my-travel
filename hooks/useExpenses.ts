"use client";

import { useState, useEffect, useMemo } from "react";
import { Expense, Trip } from "@/types/index";
import { subscribeToExpenses, getItinerary } from "@/lib/firestore";
import { ItineraryItem } from "@/types/index";

export function useExpenses(trip: Trip | null) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToExpenses((data) => {
      setExpenses(data);
      setLoading(false);
    });

    getItinerary().then(setItinerary);

    return () => unsubscribe();
  }, []);

  const summary = useMemo(() => {
    if (!trip) return null;

    const estimatedBySGD = itinerary
      .filter((item) => item.estimatedPrice.currency === "SGD")
      .reduce((sum, item) => sum + item.estimatedPrice.amount, 0);

    const estimatedByMYR = itinerary
      .filter((item) => item.estimatedPrice.currency === "MYR")
      .reduce((sum, item) => sum + item.estimatedPrice.amount, 0);

    const estimatedVND =
      estimatedBySGD * trip.exchangeRates.SGD +
      estimatedByMYR * trip.exchangeRates.MYR;

    const actualBySGD = expenses
      .filter((exp) => exp.currency === "SGD")
      .reduce((sum, exp) => sum + exp.amount, 0);

    const actualByMYR = expenses
      .filter((exp) => exp.currency === "MYR")
      .reduce((sum, exp) => sum + exp.amount, 0);

    const actualVND =
      actualBySGD * trip.exchangeRates.SGD +
      actualByMYR * trip.exchangeRates.MYR;

    return {
      estimated: { SGD: estimatedBySGD, MYR: estimatedByMYR, VND: estimatedVND },
      actual: { SGD: actualBySGD, MYR: actualByMYR, VND: actualVND },
      remaining: {
        SGD: trip.budget.SGD - actualBySGD,
        MYR: trip.budget.MYR - actualByMYR,
      },
    };
  }, [expenses, itinerary, trip]);

  const categoryBreakdown = useMemo(() => {
    const breakdown = expenses.reduce(
      (acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      },
      {} as Record<string, number>
    );
    return breakdown;
  }, [expenses]);

  return {
    expenses,
    loading,
    summary,
    categoryBreakdown,
  };
}
