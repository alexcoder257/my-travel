"use client";

import { useTrip } from "@/hooks/useTrip";
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useItinerary } from "@/hooks/useItinerary";
import { useExpenses } from "@/hooks/useExpenses";
import Link from "next/link";
import { Loader } from "lucide-react";

export default function Dashboard() {
  const { trip, loading: tripLoading } = useTrip();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(trip?.name || "");
  const [startDate, setStartDate] = useState(trip?.startDate ? trip.startDate.toISOString().slice(0,10) : "");
  const [endDate, setEndDate] = useState(trip?.endDate ? trip.endDate.toISOString().slice(0,10) : "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!trip) return;
    setSaving(true);
    try {
      const tripRef = doc(db, "trips", trip.id);
      await updateDoc(tripRef, {
        name: title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      setEditing(false);
      // Auto reload page to get latest info
      window.location.reload();
    } finally {
      setSaving(false);
    }
  };
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
      {/* Title/Header at top */}
      <div className="mb-6">
        {editing ? (
          <div className="space-y-2">
            <input
              className="text-3xl md:text-5xl font-extrabold text-gray-900 w-full border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={saving}
            />
            <div className="flex gap-2 items-center mt-1">
              <input
                type="date"
                className="border rounded px-2 py-1"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                disabled={saving}
              />
              <span>-</span>
              <input
                type="date"
                className="border rounded px-2 py-1"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                disabled={saving}
              />
              <button
                className="ml-2 px-3 py-1 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
                onClick={handleSave}
                disabled={saving}
              >Lưu</button>
              <button
                className="ml-1 px-3 py-1 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
                onClick={() => setEditing(false)}
                disabled={saving}
              >Huỷ</button>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col md:flex-row md:items-end gap-2">
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 pr-10">
              {trip.name}
            </h1>
            {/* Small red edit icon at top-right of title */}
            <button
              className="absolute top-2 right-2 md:top-3 md:right-3 rounded-full hover:bg-blue-50 focus:outline-none"
              title="Sửa thông tin chuyến đi"
              onClick={() => {
                setTitle(trip.name);
                setStartDate(trip.startDate.toISOString().slice(0,10));
                setEndDate(trip.endDate.toISOString().slice(0,10));
                setEditing(true);
              }}
            >
              {/* Blue pencil icon, same as itinerary edit */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline align-middle">
                <path d="M12 20h9" />
                <path d="M16.7 4.3a2.4 2.4 0 1 1 3.4 3.4L7.5 20.3l-4.2.5.5-4.2Z" />
              </svg>
            </button>
            <p className="text-gray-600 mt-2 md:ml-4 text-base md:text-lg">
              {trip.startDate.toLocaleDateString("vi-VN")} - {trip.endDate.toLocaleDateString("vi-VN")}
            </p>
          </div>
        )}
      </div>

      {/* Next Activity card below title */}
      {nextActivity && (
        <button
          className="w-full text-left bg-blue-50 p-4 md:p-6 rounded-xl border border-blue-200 hover:bg-blue-100 transition mb-8 flex items-center justify-between gap-4 shadow-sm focus:outline-none"
          onClick={() => {
            window.location.href = `/itinerary?scrollTo=${nextActivity.id}`;
          }}
        >
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-1 flex items-center gap-2">
              Hoạt động tiếp theo
            </h3>
            <p className="text-gray-800 font-medium text-base">{nextActivity.activity}</p>
            <p className="text-gray-600 text-sm mt-1">{nextActivity.location}</p>
            <p className="text-gray-600 text-sm">
              {nextActivity.date} lúc {nextActivity.time}
            </p>
          </div>
          <span className="text-blue-500 flex-shrink-0">
            {/* Arrow icon (right) */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        {/* Progress only */}
        <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Tiến độ</h3>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {visitedCount}/{totalItems}
              </p>
              <p className="text-sm text-gray-600">địa điểm đã đến</p>
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
      </div>

      {/* Spending Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Food & Activities */}
        <div className="bg-orange-50 p-4 md:p-6 rounded-lg border border-orange-200">
          <h3 className="text-sm font-semibold text-orange-700 mb-3">🍜 Ăn uống & Tham quan</h3>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Singapore</span>
              <span className="font-semibold">{summary.food.SGD.toFixed(1)} SGD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Malaysia</span>
              <span className="font-semibold">{summary.food.MYR.toFixed(1)} MYR</span>
            </div>
            <div className="border-t border-orange-200 pt-2 mt-2 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Tổng (VND)</span>
              <span className="font-bold text-orange-700">{summary.food.VND.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Transport */}
        <div className="bg-blue-50 p-4 md:p-6 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-700 mb-3">🚗 Di chuyển</h3>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Singapore</span>
              <span className="font-semibold">{summary.transport.SGD.toFixed(1)} SGD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Malaysia</span>
              <span className="font-semibold">{summary.transport.MYR.toFixed(1)} MYR</span>
            </div>
            <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Tổng (VND)</span>
              <span className="font-bold text-blue-700">{summary.transport.VND.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grand Total */}
      <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng chi tiêu</h3>
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div>
            <p className="text-xs md:text-sm text-gray-500">Dự toán</p>
            <p className="text-lg md:text-xl font-bold text-gray-900 mt-1">
              {summary.estimated.VND.toLocaleString()}
              <span className="text-xs text-gray-500 ml-1">đ</span>
            </p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Thực tế</p>
            <p className="text-lg md:text-xl font-bold text-blue-600 mt-1">
              {summary.actual.VND.toLocaleString()}
              <span className="text-xs text-gray-500 ml-1">đ</span>
            </p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Tiết kiệm</p>
            <p className={`text-lg md:text-xl font-bold mt-1 ${summary.estimated.VND >= summary.actual.VND ? "text-green-600" : "text-red-600"}`}>
              {Math.abs(summary.estimated.VND - summary.actual.VND).toLocaleString()}
              <span className="text-xs text-gray-500 ml-1">đ</span>
            </p>
          </div>
        </div>
      </div>

      {/* ...removed old Next Activity block... */}


    </div>
  );
}
