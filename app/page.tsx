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
      {/* Next Activity at top */}
      {nextActivity && (
        <button
          className="w-full text-left bg-blue-50 p-4 md:p-6 rounded-lg border border-blue-200 hover:bg-blue-100 transition mb-6 focus:outline-none"
          onClick={() => {
            window.location.href = `/itinerary?scrollTo=${nextActivity.id}`;
          }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Hoạt động tiếp theo
          </h3>
          <p className="text-gray-700 font-medium">{nextActivity.activity}</p>
          <p className="text-gray-600 text-sm mt-1">{nextActivity.location}</p>
          <p className="text-gray-600 text-sm">
            {nextActivity.date} lúc {nextActivity.time}
          </p>
        </button>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900">
          {trip.name}
        </h1>
        <p className="text-gray-600 mt-2">
          {trip.startDate.toLocaleDateString("vi-VN")} -{" "}
          {trip.endDate.toLocaleDateString("vi-VN")}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progress */}
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

        {/* Budget SGD */}
        <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Ngân sách Singapore
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            {summary.actual.SGD.toFixed(0)}
            <span className="text-lg text-gray-600 ml-1">SGD</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Dự toán: {trip.budget.SGD} SGD
          </p>
          <div className="mt-2 text-sm">
            {summary.remaining.SGD >= 0 ? (
              <p className="text-green-600">
                {summary.remaining.SGD.toFixed(0)} SGD còn lại
              </p>
            ) : (
              <p className="text-red-600">
                Vượt {Math.abs(summary.remaining.SGD).toFixed(0)} SGD
              </p>
            )}
          </div>
        </div>

        {/* Budget MYR */}
        <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Ngân sách Malaysia
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            {summary.actual.MYR.toFixed(0)}
            <span className="text-lg text-gray-600 ml-1">MYR</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Dự toán: {trip.budget.MYR} MYR
          </p>
          <div className="mt-2 text-sm">
            {summary.remaining.MYR >= 0 ? (
              <p className="text-green-600">
                {summary.remaining.MYR.toFixed(0)} MYR còn lại
              </p>
            ) : (
              <p className="text-red-600">
                Vượt {Math.abs(summary.remaining.MYR).toFixed(0)} MYR
              </p>
            )}
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

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/itinerary"
          className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-400 transition text-center"
        >
          <h3 className="text-lg font-semibold text-gray-900">Lịch trình</h3>
          <p className="text-sm text-gray-600 mt-1">Xem lịch trình hàng ngày</p>
        </Link>

        <Link
          href="/checklist"
          className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-400 transition text-center"
        >
          <h3 className="text-lg font-semibold text-gray-900">Danh sách</h3>
          <p className="text-sm text-gray-600 mt-1">
            Theo dõi địa điểm đã đến ({visitedCount} đã xong)
          </p>
        </Link>
      </div>
    </div>
  );
}
