"use client";

import { useTrip } from "@/hooks/useTrip";
import { useItinerary } from "@/hooks/useItinerary";
import { useExpenses } from "@/hooks/useExpenses";
import Link from "next/link";
import { Loader } from "lucide-react";

export default function Dashboard() {
  const { trip, loading: tripLoading } = useTrip();
  const { items: itinerary, loading: itineraryLoading } = useItinerary();
  const { summary } = useExpenses(trip);

  const visitedCount = itinerary.filter((item) => item.visited).length;
  const totalItems = itinerary.length;
  const progress = totalItems > 0 ? (visitedCount / totalItems) * 100 : 0;

  const nextActivity = itinerary.find((item) => !item.visited);

  if (tripLoading || itineraryLoading || !trip || !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          {trip.name}
        </h1>
        <p className="text-gray-600 mt-2">
          {trip.startDate.toLocaleDateString()} -{" "}
          {trip.endDate.toLocaleDateString()}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progress */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Progress</h3>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {visitedCount}/{totalItems}
              </p>
              <p className="text-sm text-gray-600">places visited</p>
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">{progress.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        {/* Budget SGD */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Singapore Budget
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {summary.actual.SGD.toFixed(0)}
            <span className="text-lg text-gray-600 ml-1">SGD</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Budget: {trip.budget.SGD} SGD
          </p>
          <div className="mt-2 text-sm">
            {summary.remaining.SGD >= 0 ? (
              <p className="text-green-600">
                ${summary.remaining.SGD.toFixed(0)} remaining
              </p>
            ) : (
              <p className="text-red-600">
                ${Math.abs(summary.remaining.SGD).toFixed(0)} over budget
              </p>
            )}
          </div>
        </div>

        {/* Budget MYR */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Malaysia Budget
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {summary.actual.MYR.toFixed(0)}
            <span className="text-lg text-gray-600 ml-1">MYR</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Budget: {trip.budget.MYR} MYR
          </p>
          <div className="mt-2 text-sm">
            {summary.remaining.MYR >= 0 ? (
              <p className="text-green-600">
                ${summary.remaining.MYR.toFixed(0)} remaining
              </p>
            ) : (
              <p className="text-red-600">
                ${Math.abs(summary.remaining.MYR).toFixed(0)} over budget
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Total Spending */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Total Spending
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Estimated</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {(
                summary.estimated.VND
              ).toLocaleString()}
              <span className="text-sm text-gray-600 ml-1">VND</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Actual</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {(summary.actual.VND).toLocaleString()}
              <span className="text-sm text-gray-600 ml-1">VND</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Difference</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                summary.estimated.VND >= summary.actual.VND
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {(
                summary.estimated.VND - summary.actual.VND
              ).toLocaleString()}
              <span className="text-sm text-gray-600 ml-1">VND</span>
            </p>
          </div>
        </div>
      </div>

      {/* Next Activity */}
      {nextActivity && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Next Activity
          </h3>
          <p className="text-gray-700 font-medium">{nextActivity.activity}</p>
          <p className="text-gray-600 text-sm mt-1">{nextActivity.location}</p>
          <p className="text-gray-600 text-sm">
            {nextActivity.date} at {nextActivity.time}
          </p>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/itinerary"
          className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-400 transition text-center"
        >
          <h3 className="text-lg font-semibold text-gray-900">Itinerary</h3>
          <p className="text-sm text-gray-600 mt-1">View daily schedule</p>
        </Link>

        <Link
          href="/checklist"
          className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-400 transition text-center"
        >
          <h3 className="text-lg font-semibold text-gray-900">Checklist</h3>
          <p className="text-sm text-gray-600 mt-1">
            Track visited places ({visitedCount} done)
          </p>
        </Link>

        <Link
          href="/expenses"
          className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-400 transition text-center"
        >
          <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
          <p className="text-sm text-gray-600 mt-1">Manage spending</p>
        </Link>
      </div>
    </div>
  );
}
