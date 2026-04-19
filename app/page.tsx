"use client";

import { useTrip } from "@/hooks/useTrip";
import { useState, useMemo } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useItinerary } from "@/hooks/useItinerary";
import { useExpenses } from "@/hooks/useExpenses";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Pencil, Calendar, MapPinned } from "lucide-react";
import { TripLoader } from "@/components/TripLoader";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1600&q=80";
// ↑ Marina Bay / Singapore skyline at blue hour (public Unsplash photo)

function formatVN(d: Date) {
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function daysDiff(from: Date, to: Date) {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export default function HomePage() {
  const { trip, loading: tripLoading } = useTrip();
  const { items: itinerary, loading: itineraryLoading } = useItinerary();
  const { summary } = useExpenses(trip);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const visitedCount = useMemo(() => itinerary.filter((i) => i.visited).length, [itinerary]);
  const totalItems = itinerary.length;
  const progress = totalItems > 0 ? visitedCount / totalItems : 0;
  const nextActivity = useMemo(() => itinerary.find((i) => !i.visited), [itinerary]);

  if (tripLoading || itineraryLoading || !trip || !summary) return <TripLoader />;

  const today = new Date();
  const daysToStart = daysDiff(today, trip.startDate);
  const tripLen = daysDiff(trip.startDate, trip.endDate) + 1;
  const dayBadge =
    daysToStart > 0
      ? `Còn ${daysToStart} ngày`
      : daysToStart === 0
      ? "Hôm nay khởi hành!"
      : daysToStart >= -tripLen
      ? `Ngày ${Math.abs(daysToStart) + 1}/${tripLen}`
      : "Đã kết thúc";

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
      window.location.reload();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    setTitle(trip.name);
    setStartDate(trip.startDate.toISOString().slice(0, 10));
    setEndDate(trip.endDate.toISOString().slice(0, 10));
    setEditing(true);
  };

  return (
    <div className="relative">
      {/* ── HERO ── */}
      <section className="relative h-[78vh] min-h-[560px] w-full overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 0.68, 0, 1] }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMAGE}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(12,23,12,0.15) 0%, rgba(12,23,12,0.05) 40%, rgba(250,248,242,0.15) 70%, var(--surface-body) 100%)",
            }}
          />
        </motion.div>

        {/* Floating top chip */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="absolute top-[max(env(safe-area-inset-top),16px)] left-0 right-0 px-5 flex items-center justify-between"
        >
          <span className="glass-panel inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide"
            style={{ color: "var(--nature-900)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-berry)" }} />
            TRIP · LIVE
          </span>
          <button
            onClick={startEdit}
            aria-label="Sửa chuyến đi"
            className="glass-panel w-10 h-10 rounded-full grid place-items-center active:scale-95 transition-transform"
          >
            <Pencil className="w-4 h-4" style={{ color: "var(--nature-900)" }} />
          </button>
        </motion.div>

        {/* Hero headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 0.68, 0, 1] }}
          className="absolute left-0 right-0 bottom-[112px] px-5 text-white"
        >
          <p className="text-[13px] uppercase tracking-[0.16em] opacity-90 flex items-center gap-1.5">
            🇸🇬 · 🇲🇾 <span className="ml-1">South-East Asia</span>
          </p>
          <h1 className="mt-2 text-[44px] leading-[1.02] font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-heading, inherit)" }}>
            {trip.name}
          </h1>
          <p className="mt-2 text-white/85 text-[15px]">
            {formatVN(trip.startDate)} – {formatVN(trip.endDate)} · {tripLen} ngày
          </p>
        </motion.div>

        {/* Floating "countdown" pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55, type: "spring", stiffness: 260, damping: 22 }}
          className="absolute right-5 bottom-[56px] rounded-full px-4 py-2.5 text-sm font-semibold shadow-[var(--shadow-md)]"
          style={{ background: "var(--accent-leaf)", color: "var(--nature-900)" }}
        >
          {dayBadge}
        </motion.div>
      </section>

      {/* ── CONTINUE CARD (overlaps hero) ── */}
      <div className="relative -mt-20 px-5">
        {nextActivity ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 0.68, 0, 1] }}
          >
            <Link
              href={`/itinerary?scrollTo=${nextActivity.id}`}
              className="block rounded-[24px] overflow-hidden shadow-[var(--shadow-lg)]"
              style={{ background: "var(--nature-800)" }}
            >
              <div className="p-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.18em] opacity-70">
                    Điểm dừng tiếp theo
                  </span>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "var(--accent-leaf)", color: "var(--nature-900)" }}
                  >
                    Ngày {nextActivity.day}
                  </span>
                </div>
                <h3 className="mt-3 text-[22px] font-bold leading-tight">
                  {nextActivity.activity}
                </h3>
                <div className="mt-1.5 flex items-center gap-1.5 text-white/70 text-[13px]">
                  <MapPinned className="w-[14px] h-[14px]" />
                  <span className="truncate">{nextActivity.location}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white/60 text-[13px]">
                    <Calendar className="w-[14px] h-[14px]" />
                    <span>{nextActivity.date} · {nextActivity.time || "—"}</span>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 font-semibold text-[13px] px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.12)" }}
                  >
                    Mở lịch trình
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[24px] p-6 text-center shadow-[var(--shadow-md)]"
            style={{ background: "var(--surface-card)" }}
          >
            <p className="text-[15px]" style={{ color: "var(--surface-muted)" }}>
              Bạn đã ghé hết các địa điểm. Chuyến đi đỉnh thật! 🌿
            </p>
          </motion.div>
        )}
      </div>

      {/* ── PROGRESS ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: [0.22, 0.68, 0, 1] }}
        className="mt-7 mx-5 rounded-[24px] p-5 shadow-[var(--shadow-md)]"
        style={{ background: "var(--surface-card)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--surface-muted)" }}>
              Hành trình
            </p>
            <p className="text-[26px] font-bold mt-1" style={{ color: "var(--nature-900)" }}>
              {visitedCount}
              <span className="text-[15px] font-medium" style={{ color: "var(--surface-muted)" }}>
                /{totalItems} địa điểm
              </span>
            </p>
          </div>
          <ProgressRing value={progress} />
        </div>
        <div className="mt-4 h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--sand-200)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 1, ease: [0.22, 0.68, 0, 1], delay: 0.2 }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg,var(--nature-500),var(--accent-leaf))" }}
          />
        </div>
      </motion.section>

      {/* ── SPENDING PODS ── */}
      <section className="mt-5 px-5">
        <p className="text-[11px] uppercase tracking-[0.16em] mb-3" style={{ color: "var(--surface-muted)" }}>
          Chi tiêu
        </p>
        <div className="grid grid-cols-2 gap-3">
          <SpendPod
            label="🍜 Ăn & tham quan"
            sgd={summary.food.SGD}
            myr={summary.food.MYR}
            vnd={summary.food.VND}
            hue="warm"
            delay={0.05}
          />
          <SpendPod
            label="🚗 Di chuyển"
            sgd={summary.transport.SGD}
            myr={summary.transport.MYR}
            vnd={summary.transport.VND}
            hue="cool"
            delay={0.15}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-3 rounded-[24px] p-5 shadow-[var(--shadow-md)] text-white"
          style={{ background: "linear-gradient(135deg,var(--nature-700),var(--nature-900))" }}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] opacity-70">Tổng chi tiêu</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Stat label="Dự toán" value={summary.estimated.VND} tone="soft" />
            <Stat label="Thực tế" value={summary.actual.VND} tone="bright" />
            <Stat
              label="Tiết kiệm"
              value={Math.abs(summary.estimated.VND - summary.actual.VND)}
              tone={summary.estimated.VND >= summary.actual.VND ? "good" : "bad"}
            />
          </div>
        </motion.div>
      </section>

      {/* Edit modal (inline overlay) */}
      {editing && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(12,23,12,0.55)" }}
          onClick={() => !saving && setEditing(false)}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[28px] p-6 shadow-[var(--shadow-lg)]"
            style={{ background: "var(--surface-card)" }}
          >
            <h3 className="text-lg font-bold" style={{ color: "var(--nature-900)" }}>
              Sửa thông tin chuyến đi
            </h3>
            <label className="block mt-4 text-sm font-medium" style={{ color: "var(--surface-muted)" }}>Tên chuyến đi</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
              className="mt-1 w-full rounded-xl px-3 py-2.5 outline-none focus:ring-2"
              style={{ background: "var(--sand-100)" }}
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium" style={{ color: "var(--surface-muted)" }}>Bắt đầu</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={saving}
                  className="mt-1 w-full rounded-xl px-3 py-2.5 outline-none" style={{ background: "var(--sand-100)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium" style={{ color: "var(--surface-muted)" }}>Kết thúc</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={saving}
                  className="mt-1 w-full rounded-xl px-3 py-2.5 outline-none" style={{ background: "var(--sand-100)" }} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button disabled={saving} onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ color: "var(--surface-muted)" }}>Huỷ</button>
              <button disabled={saving} onClick={handleSave}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white active:scale-[.98] transition"
                style={{ background: "var(--nature-700)" }}>
                {saving ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── helpers ─── */

function ProgressRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
      <circle cx="32" cy="32" r={r} stroke="var(--sand-200)" strokeWidth="6" fill="none" />
      <motion.circle
        cx="32" cy="32" r={r} fill="none" strokeLinecap="round" strokeWidth="6"
        stroke="var(--nature-600)"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - c * value }}
        transition={{ duration: 1, ease: [0.22, 0.68, 0, 1], delay: 0.2 }}
      />
      <text x="32" y="36" textAnchor="middle" transform="rotate(90 32 32)"
        fontSize="13" fontWeight="700" fill="var(--nature-900)">
        {Math.round(value * 100)}%
      </text>
    </svg>
  );
}

function SpendPod({
  label, sgd, myr, vnd, hue, delay = 0,
}: { label: string; sgd: number; myr: number; vnd: number; hue: "warm" | "cool"; delay?: number; }) {
  const bg = hue === "warm"
    ? "linear-gradient(160deg,#fff7e3,#ffe7bf)"
    : "linear-gradient(160deg,#e7f1e2,#c9e8c8)";
  const ink = hue === "warm" ? "#7a4a10" : "var(--nature-800)";
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay, duration: 0.5, ease: [0.22, 0.68, 0, 1] }}
      className="rounded-[20px] p-4 shadow-[var(--shadow-sm)]"
      style={{ background: bg }}
    >
      <p className="text-[12px] font-semibold" style={{ color: ink }}>{label}</p>
      <p className="mt-2 text-[20px] font-bold leading-tight" style={{ color: ink }}>
        {vnd.toLocaleString()}<span className="text-[11px] font-medium opacity-70">đ</span>
      </p>
      <p className="mt-1 text-[11px]" style={{ color: ink, opacity: 0.7 }}>
        {sgd.toFixed(1)} SGD · {myr.toFixed(1)} MYR
      </p>
    </motion.div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "soft" | "bright" | "good" | "bad" }) {
  const color =
    tone === "bright" ? "var(--accent-leaf)" :
    tone === "good" ? "var(--accent-leaf)" :
    tone === "bad" ? "#ffb4b4" : "rgba(255,255,255,0.85)";
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-[17px] font-bold leading-tight" style={{ color }}>
        {value.toLocaleString()}<span className="text-[10px] font-medium opacity-70">đ</span>
      </p>
    </div>
  );
}
