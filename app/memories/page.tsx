"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useItinerary } from "@/hooks/useItinerary";
import { useTrip } from "@/hooks/useTrip";
import { useExpenses } from "@/hooks/useExpenses";
import { TripLoader } from "@/components/TripLoader";
import { NotebookPen, BookHeart, MapPin, Clock } from "lucide-react";

const PILL =
  "shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors";

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

  if (tripLoading || itineraryLoading || expensesLoading)
    return <TripLoader label="Đang tải nhật ký…" />;

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
  const isSG = (currency: string) => currency === "SGD";

  return (
    <div className="pb-8" style={{ background: "var(--surface-body)" }}>
      {/* ── HEADER ── */}
      <div className="px-5 pt-[max(env(safe-area-inset-top),20px)] pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-2xl grid place-items-center"
            style={{ background: "linear-gradient(135deg,var(--nature-600),var(--nature-800))" }}
          >
            <BookHeart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[24px] font-extrabold leading-tight" style={{ color: "var(--nature-900)" }}>
              Nhật ký
            </h1>
            <p className="text-[12px]" style={{ color: "var(--surface-muted)" }}>
              {filtered.length} địa điểm đã ghé
            </p>
          </div>
        </div>
      </div>

      {/* ── STAT PODS ── */}
      {filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-5 grid grid-cols-2 gap-3 mb-5"
        >
          <StatPod emoji="📍" value={filtered.length.toString()} label="Địa điểm ghé"
            bg="linear-gradient(135deg,var(--nature-100),var(--nature-200))" color="var(--nature-800)" />
          <StatPod emoji="📝" value={withNotes.length.toString()} label="Ghi chú lưu"
            bg="linear-gradient(135deg,var(--sand-100),var(--sand-200))" color="var(--nature-800)" />
          <StatPod emoji="🍜" value={`${(totalFood / 1000).toFixed(0)}K`} label="Ăn & tham quan"
            bg="linear-gradient(135deg,#fff3d6,#ffd98a)" color="#7a4a10" />
          <StatPod emoji="🚗" value={`${(totalTransport / 1000).toFixed(0)}K`} label="Di chuyển"
            bg="linear-gradient(135deg,#e0ecff,#b8cdff)" color="#1a4080" />
        </motion.div>
      )}

      {/* ── FILTERS ── */}
      <div className="px-5 mb-5 space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide shrink-0" style={{ color: "var(--surface-muted)" }}>Quốc gia</span>
          {[["all","Tất cả"], ["SGD","🇸🇬 Singapore"], ["MYR","🇲🇾 Malaysia"]].map(([v, label]) => (
            <button key={v} onClick={() => setFilterCountry(v)}
              className={`${PILL} ${filterCountry === v ? "text-white" : "bg-[var(--sand-100)] text-[var(--nature-800)]"}`}
              style={filterCountry === v ? { background: "var(--nature-700)" } : {}}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide shrink-0" style={{ color: "var(--surface-muted)" }}>Ngày</span>
          <button onClick={() => setFilterDay("all")}
            className={`${PILL} ${filterDay === "all" ? "text-white" : "bg-[var(--sand-100)] text-[var(--nature-800)]"}`}
            style={filterDay === "all" ? { background: "var(--nature-700)" } : {}}>
            Tất cả
          </button>
          {uniqueDays.map((d) => (
            <button key={d} onClick={() => setFilterDay(d.toString())}
              className={`${PILL} ${filterDay === d.toString() ? "text-white" : "bg-[var(--sand-100)] text-[var(--nature-800)]"}`}
              style={filterDay === d.toString() ? { background: "var(--nature-700)" } : {}}>
              N.{d}
            </button>
          ))}
        </div>
      </div>

      {/* ── EMPTY STATE ── */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 px-8 text-center gap-5"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="w-24 h-24 rounded-full grid place-items-center text-5xl shadow-[var(--shadow-md)]"
            style={{ background: "linear-gradient(135deg,var(--nature-100),var(--nature-200))" }}
          >
            📖
          </motion.div>
          <div>
            <p className="text-[18px] font-bold" style={{ color: "var(--nature-900)" }}>
              Nhật ký còn trống
            </p>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--surface-muted)" }}>
              Tích vào những điểm bạn đã ghé trong<br />Lịch trình để ghi dấu hành trình
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold"
            style={{ background: "var(--sand-100)", color: "var(--nature-700)" }}>
            <BookHeart className="w-4 h-4" />
            Kỷ niệm của bạn sẽ xuất hiện tại đây
          </div>
        </motion.div>
      )}

      {/* ── MEMORY CARDS ── */}
      {filtered.length > 0 && (
        <div className="px-5 space-y-4">
          {filtered.map(({ vp, item }, idx) => {
            const foodAmt = vp.foodCost?.amount || 0;
            const transportAmt = vp.transportCost?.amount || 0;
            const currency = vp.foodCost?.currency || vp.transportCost?.currency || item.estimatedPrice.currency;
            const isSGItem = isSG(item.estimatedPrice.currency);
            const totalVND = toVND(
              currency === "SGD" ? foodAmt + transportAmt : 0,
              currency === "MYR" ? foodAmt + transportAmt : 0
            );

            return (
              <motion.div
                key={vp.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: Math.min(idx * 0.05, 0.3), duration: 0.45, ease: [0.22, 0.68, 0, 1] }}
                className="rounded-[24px] overflow-hidden"
                style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-md)" }}
              >
                {/* Country accent bar */}
                <div className="h-[3px] w-full" style={{
                  background: isSGItem
                    ? "linear-gradient(90deg,#e63b45,#f8a5a5)"
                    : "linear-gradient(90deg,#1a5cb8,#5b9bf8)",
                }} />

                <div className="p-4">
                  {/* Top row */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl grid place-items-center text-xl flex-shrink-0"
                      style={{
                        background: isSGItem
                          ? "linear-gradient(135deg,#ffecec,#ffb8b8)"
                          : "linear-gradient(135deg,#e0ecff,#b8cdff)",
                      }}
                    >
                      {isSGItem ? "🇸🇬" : "🇲🇾"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[15px] leading-snug" style={{ color: "var(--nature-900)" }}>
                        {item.activity}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5" style={{ color: "var(--surface-muted)" }}>
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="text-[12px] truncate">{item.location}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: "var(--nature-100)", color: "var(--nature-700)" }}>
                      N.{item.day}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="mt-2.5 flex items-center gap-1.5" style={{ color: "var(--surface-muted)" }}>
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[12px]">{item.date} lúc {item.time}</span>
                  </div>

                  {/* Spend pills */}
                  {(foodAmt > 0 || transportAmt > 0) && (
                    <div className="mt-3 flex items-center flex-wrap gap-2">
                      {foodAmt > 0 && (
                        <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: "linear-gradient(135deg,#fff3d6,#ffd98a)", color: "#7a4a10" }}>
                          🍜 {foodAmt} {currency}
                        </span>
                      )}
                      {transportAmt > 0 && (
                        <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: "linear-gradient(135deg,#e0ecff,#b8cdff)", color: "#1a4080" }}>
                          🚗 {transportAmt} {currency}
                        </span>
                      )}
                      {totalVND > 0 && (
                        <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full ml-auto"
                          style={{ background: "var(--sand-100)", color: "var(--nature-700)" }}>
                          ≈ {totalVND.toLocaleString()}đ
                        </span>
                      )}
                    </div>
                  )}

                  {/* Notes — always visible */}
                  {vp.notes && (
                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold mb-2"
                        style={{ color: "var(--nature-600)" }}>
                        <NotebookPen className="w-3.5 h-3.5" />
                        Ghi chú trải nghiệm
                      </div>
                      <p className="text-[13px] leading-relaxed rounded-2xl p-3"
                        style={{ background: "var(--sand-100)", color: "var(--nature-800)" }}>
                        {vp.notes}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatPod({
  emoji, value, label, bg, color,
}: { emoji: string; value: string; label: string; bg: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-[20px] p-4"
      style={{ background: bg, boxShadow: "var(--shadow-sm)" }}
    >
      <span className="text-2xl">{emoji}</span>
      <p className="mt-2 text-[22px] font-extrabold leading-tight" style={{ color }}>{value}</p>
      <p className="text-[11px] font-medium mt-0.5" style={{ color, opacity: 0.75 }}>{label}</p>
    </motion.div>
  );
}
