"use client";

import { useState, useMemo } from "react";
import { useItinerary } from "@/hooks/useItinerary";
import { useTrip } from "@/hooks/useTrip";
import { useExpenses } from "@/hooks/useExpenses";
import { Loader, NotebookPen } from "lucide-react";

export default function MemoriesPage() {
  const { trip, loading: tripLoading } = useTrip();
  const { items: itinerary, loading: itineraryLoading } = useItinerary();
  const { visitedPlaces, loading: expensesLoading } = useExpenses(trip);

  const [filterDay, setFilterDay] = useState<string>("all");
  const [filterCountry, setFilterCountry] = useState<string>("all");

  const uniqueDays = useMemo(
    () => Array.from(new Set(itinerary.map((i) => i.day))).sort((a, b) => a - b),
    [itinerary]
  );

  const itineraryMap = useMemo(
    () => Object.fromEntries(itinerary.map((i) => [i.id, i])),
    [itinerary]
  );

  const visitedWithDetails = useMemo(() => {
    return visitedPlaces
      .map((vp) => ({ vp, item: itineraryMap[vp.itineraryItemId] }))
      .filter(({ item }) => !!item)
      .sort((a, b) => {
        // Sort theo ngày tăng dần, nếu cùng ngày thì theo order
        if (a.item.day !== b.item.day) return a.item.day - b.item.day;
        return (a.item.order ?? 0) - (b.item.order ?? 0);
      });
  }, [visitedPlaces, itineraryMap]);

  const filtered = useMemo(() => {
    return visitedWithDetails.filter(({ item }) => {
      const dayMatch = filterDay === "all" || item.day.toString() === filterDay;
      const countryMatch =
        filterCountry === "all" ||
        (filterCountry === "SGD" && item.estimatedPrice.currency === "SGD") ||
        (filterCountry === "MYR" && item.estimatedPrice.currency === "MYR");
      return dayMatch && countryMatch;
    });
  }, [visitedWithDetails, filterDay, filterCountry]);

  if (tripLoading || itineraryLoading || expensesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const toVND = (sgd: number, myr: number) => {
    if (!trip) return 0;
    return sgd * trip.exchangeRates.SGD + myr * trip.exchangeRates.MYR;
  };

  const totalFood = filtered.reduce((s, { vp }) => {
    const sgd = vp.foodCost?.currency === "SGD" ? vp.foodCost.amount : 0;
    const myr = vp.foodCost?.currency === "MYR" ? vp.foodCost.amount : 0;
    return s + toVND(sgd, myr);
  }, 0);

  const totalTransport = filtered.reduce((s, { vp }) => {
    const sgd = vp.transportCost?.currency === "SGD" ? vp.transportCost.amount : 0;
    const myr = vp.transportCost?.currency === "MYR" ? vp.transportCost.amount : 0;
    return s + toVND(sgd, myr);
  }, 0);

  const withNotes = filtered.filter(({ vp }) => vp.notes?.trim());

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Nhật ký chuyến đi</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Theo ngày</label>
          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Tất cả ngày</option>
            {uniqueDays.map((day) => (
              <option key={day} value={day.toString()}>
                Ngày {day}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Theo quốc gia</label>
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Tất cả</option>
            <option value="SGD">Singapore</option>
            <option value="MYR">Malaysia</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 text-center">
          <p className="text-xl md:text-2xl font-bold text-gray-900">{filtered.length}</p>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Địa điểm đã đến</p>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 text-center">
          <p className="text-xl md:text-2xl font-bold text-gray-900">{withNotes.length}</p>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Ghi chú trải nghiệm</p>
        </div>
        <div className="bg-orange-50 p-3 md:p-4 rounded-lg border border-orange-200 text-center">
          <p className="text-base md:text-lg font-bold text-orange-700 truncate">{totalFood.toLocaleString()}đ</p>
          <p className="text-xs md:text-sm text-orange-600 mt-1">Ăn uống & tham quan</p>
        </div>
        <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200 text-center">
          <p className="text-base md:text-lg font-bold text-blue-700 truncate">{totalTransport.toLocaleString()}đ</p>
          <p className="text-xs md:text-sm text-blue-600 mt-1">Di chuyển</p>
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          Chưa có địa điểm nào được ghi nhận
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(({ vp, item }) => {
            const foodAmt = vp.foodCost?.amount || 0;
            const transportAmt = vp.transportCost?.amount || 0;
            const currency = vp.foodCost?.currency || vp.transportCost?.currency || item.estimatedPrice.currency;
            const country = item.estimatedPrice.currency === "SGD" ? "Singapore" : "Malaysia";

            return (
              <div key={vp.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {/* Country/day header strip */}
                <div className={`px-4 py-2 flex items-center gap-2 ${item.estimatedPrice.currency === "SGD" ? "bg-red-50" : "bg-blue-50"}`}>
                  <span className="text-xl">{item.estimatedPrice.currency === "SGD" ? "🇸🇬" : "🇲🇾"}</span>
                  <span className="text-xs font-medium text-gray-600">{country} · Ngày {item.day}</span>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 leading-tight truncate">{item.activity}</h3>
                    <p className="text-sm text-gray-500 truncate">{item.location}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.date} lúc {item.time}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-orange-50 rounded-lg p-2">
                      <p className="text-xs text-orange-600 mb-0.5">Ăn uống & tham quan</p>
                      <p className="text-sm font-semibold text-orange-700">
                        {foodAmt > 0 ? `${foodAmt} ${currency}` : "—"}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2">
                      <p className="text-xs text-blue-600 mb-0.5">Di chuyển</p>
                      <p className="text-sm font-semibold text-blue-700">
                        {transportAmt > 0 ? `${transportAmt} ${currency}` : "—"}
                      </p>
                    </div>
                  </div>

                  {(foodAmt > 0 || transportAmt > 0) && (
                    <div className="text-right text-xs text-gray-500">
                      Tổng: {(toVND(
                        (currency === "SGD" ? foodAmt + transportAmt : 0),
                        (currency === "MYR" ? foodAmt + transportAmt : 0)
                      )).toLocaleString()}đ
                    </div>
                  )}

                  {vp.notes && (
                    <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                      <div className="flex items-center gap-1 mb-1">
                        <NotebookPen className="w-3 h-3 text-indigo-500" />
                        <span className="text-xs font-medium text-indigo-600">Ghi chú trải nghiệm</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{vp.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
