"use client";

import { useState, useMemo } from "react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useTripData } from "@/contexts/TripDataContext";
import { useExpenses } from "@/hooks/useExpenses";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight, Pencil, Calendar, MapPinned } from "lucide-react";
import { TripLoader } from "@/components/TripLoader";
import { COUNTRIES, getHeroImage, buildTripName } from "@/lib/countries";
import { useTranslation } from "@/lib/i18n";

function formatVN(d: Date, lang: string) {
  return d.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "2-digit" });
}

function daysDiff(from: Date, to: Date) {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export default function TripDashboardPage() {
  const params = useParams();
  const tripId = params?.tripId as string;

  const { trip, tripLoading, items: itinerary, itineraryLoading, canEdit } = useTripData();
  const { summary } = useExpenses(trip);
  const { t, language } = useTranslation();

  const [editing, setEditing] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const visitedCount = useMemo(() => itinerary.filter((i) => i.visited).length, [itinerary]);
  const totalItems = itinerary.length;
  const progress = totalItems > 0 ? visitedCount / totalItems : 0;
  const nextActivity = useMemo(() => itinerary.find((i) => !i.visited), [itinerary]);

  if (tripLoading || itineraryLoading || !trip || !summary) return <TripLoader label={t("common.loading")} />;

  const today = new Date();
  const daysToStart = daysDiff(today, trip.startDate);
  const tripLen = daysDiff(trip.startDate, trip.endDate) + 1;
  const dayBadge =
    daysToStart > 0
      ? t("home.days_to_start", { count: daysToStart })
      : daysToStart === 0
      ? t("home.departure_today")
      : daysToStart >= -tripLen
      ? t("home.day_progress", { current: Math.abs(daysToStart) + 1, total: tripLen })
      : t("home.trip_ended");

  const heroImage = getHeroImage(trip.countries ?? []);
  const heroFlags = (trip.countries ?? [])
    .map((c) => COUNTRIES.find((x) => x.code === c)?.flag)
    .filter(Boolean)
    .join(" · ");

  const handleSave = async () => {
    if (!trip) return;
    setSaving(true);
    try {
      const tripRef = doc(db, "trips", trip.id);
      await updateDoc(tripRef, {
        countries: selectedCountries,
        name: buildTripName(selectedCountries),
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    if (!canEdit) return;
    setSelectedCountries(trip.countries ?? []);
    setStartDate(trip.startDate.toISOString().slice(0, 10));
    setEndDate(trip.endDate.toISOString().slice(0, 10));
    setEditing(true);
  };

  const toggleCountry = (code: string) => {
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const derivedName = buildTripName(selectedCountries);

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
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(12,23,12,0.2) 0%, rgba(12,23,12,0.1) 35%, rgba(12,23,12,0.55) 65%, rgba(12,23,12,0.75) 85%, var(--surface-body) 100%)",
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
          <Link href={`/trip/${tripId}/itinerary`}>
            <span className="glass-panel inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-semibold tracking-wide"
              style={{ color: "var(--nature-900)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-berry)" }} />
              {t("home.trip_live")}
            </span>
          </Link>
          {canEdit && (
            <button
              onClick={startEdit}
              aria-label={t("home.edit_trip")}
              className="glass-panel w-10 h-10 rounded-full grid place-items-center active:scale-95 transition-transform"
            >
              <Pencil className="w-4 h-4" style={{ color: "var(--nature-900)" }} />
            </button>
          )}
        </motion.div>

        {/* Hero headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 0.68, 0, 1] }}
          className="absolute left-0 right-0 bottom-[112px] px-5 text-white"
        >
          <p className="text-[15px] uppercase tracking-[0.16em] opacity-90 flex items-center gap-1.5 font-medium"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
            {heroFlags || "🌏"} <span className="ml-1">{t("home.sea")}</span>
          </p>
          <h1 className="mt-2 text-[42px] leading-[1.02] font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-heading, inherit)", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
            {trip.name}
          </h1>
          <div className="mt-3 flex items-center gap-2.5">
            <p className="text-white/80 text-[15px]">
              {formatVN(trip.startDate, language)} – {formatVN(trip.endDate, language)} · {t("home.days", { count: tripLen })}
            </p>
            <Link href={`/trip/${tripId}/itinerary`}>
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55, type: "spring", stiffness: 260, damping: 22 }}
                className="rounded-full px-3 py-1 text-[13px] font-bold shadow-[var(--shadow-sm)] whitespace-nowrap cursor-pointer"
                style={{ background: "var(--accent-leaf)", color: "var(--nature-900)" }}
              >
                {dayBadge}
              </motion.span>
            </Link>
          </div>
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
              href={`/trip/${tripId}/itinerary?scrollTo=${nextActivity.id}`}
              className="block rounded-[24px] overflow-hidden shadow-[var(--shadow-lg)]"
              style={{ background: "var(--nature-800)" }}
            >
              <div className="p-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] uppercase tracking-[0.18em] opacity-80 font-semibold">
                    {t("home.next_stop")}
                  </span>
                  <span
                    className="text-[13px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: "var(--accent-leaf)", color: "var(--nature-900)" }}
                  >
                    {t("itinerary.day")} {nextActivity.day}
                  </span>
                </div>
                <h3 className="mt-3 text-[24px] font-bold leading-tight">
                  {nextActivity.activity}
                </h3>
                <div className="mt-1.5 flex items-center gap-1.5 text-white/70 text-[15px]">
                  <MapPinned className="w-[16px] h-[16px]" />
                  <span className="truncate">{nextActivity.location}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white/60 text-[15px]">
                    <Calendar className="w-[16px] h-[16px]" />
                    <span>{nextActivity.date} · {nextActivity.time || "—"}</span>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 font-semibold text-[14px] px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.12)" }}
                  >
                    {t("home.open_itinerary")}
                    <ArrowUpRight className="w-4 h-4" />
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
              {t("home.all_visited")}
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
            <p className="text-[13px] uppercase tracking-[0.16em]" style={{ color: "var(--surface-muted)" }}>
              {t("home.journey")}
            </p>
            <p className="text-[28px] font-bold mt-1" style={{ color: "var(--nature-900)" }}>
              {visitedCount}
              <span className="text-[17px] font-medium ml-1" style={{ color: "var(--surface-muted)" }}>
                /{totalItems} {t("memories.visited_pod").toLowerCase()}
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
      <section className="mt-5 px-5 pb-8">
        <p className="text-[13px] uppercase tracking-[0.16em] mb-3" style={{ color: "var(--surface-muted)" }}>
          {t("home.spending")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <SpendPod
            label={t("memories.food_pod")}
            sgd={summary.food.SGD}
            myr={summary.food.MYR}
            vnd={summary.food.VND}
            hue="warm"
            delay={0.05}
          />
          <SpendPod
            label={t("memories.transport_pod")}
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
          <p className="text-[13px] uppercase tracking-[0.16em] opacity-80 font-semibold">{t("home.total_spending")}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label={t("home.budget")} value={summary.estimated.VND} tone="soft" />
            <Stat label={t("home.actual")} value={summary.actual.VND} tone="bright" />
            <Stat
              label={t("home.saving")}
              value={Math.abs(summary.estimated.VND - summary.actual.VND)}
              tone={summary.estimated.VND >= summary.actual.VND ? "good" : "bad"}
            />
          </div>
        </motion.div>
      </section>

      {/* ── EDIT MODAL ── */}
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
              {t("home.edit_title")}
            </h3>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--surface-muted)" }}>
                {t("itinerary.country")}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {COUNTRIES.map((country) => {
                  const selected = selectedCountries.includes(country.code);
                  return (
                    <button
                      key={country.code}
                      type="button"
                      disabled={saving}
                      onClick={() => toggleCountry(country.code)}
                      className="flex flex-col items-center gap-1 rounded-[16px] py-2.5 px-1 transition-all active:scale-95"
                      style={{
                        background: selected ? "var(--nature-100)" : "var(--sand-100)",
                        boxShadow: selected ? "0 0 0 2px var(--nature-500)" : "none",
                      }}
                    >
                      <span className="text-[22px] leading-none">{country.flag}</span>
                      <span className="text-[10px] font-semibold leading-tight text-center"
                        style={{ color: selected ? "var(--nature-800)" : "var(--surface-muted)" }}>
                        {country.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedCountries.length > 0 && (
                <div className="mt-3 px-3 py-2 rounded-xl text-[13px] font-semibold"
                  style={{ background: "var(--nature-100)", color: "var(--nature-800)" }}>
                  ✈️ {derivedName}
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium" style={{ color: "var(--surface-muted)" }}>{t("home.start_date")}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={saving}
                  className="mt-1 w-full rounded-xl px-3 py-2.5 outline-none text-base"
                  style={{ background: "var(--sand-100)" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium" style={{ color: "var(--surface-muted)" }}>{t("home.end_date")}</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={saving}
                  className="mt-1 w-full rounded-xl px-3 py-2.5 outline-none text-base"
                  style={{ background: "var(--sand-100)" }}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                disabled={saving}
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ color: "var(--surface-muted)" }}
              >
                {t("common.cancel")}
              </button>
              <button
                disabled={saving || selectedCountries.length === 0}
                onClick={handleSave}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white active:scale-[.98] transition disabled:opacity-50"
                style={{ background: "var(--nature-700)" }}
              >
                {saving ? t("common.loading") : t("common.save")}
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
        fontSize="14" fontWeight="700" fill="var(--nature-900)">
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
      <p className="text-[14px] font-bold" style={{ color: ink }}>{label}</p>
      <p className="mt-2 text-[22px] font-bold leading-tight" style={{ color: ink }}>
        {vnd.toLocaleString("vi-VN")}<span className="text-[13px] font-medium opacity-70 ml-0.5">đ</span>
      </p>
      <p className="mt-1 text-[13px]" style={{ color: ink, opacity: 0.7 }}>
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
      <p className="text-[13px] uppercase tracking-wide opacity-80 font-semibold">{label}</p>
      <p className="mt-1 text-[18px] font-bold leading-tight" style={{ color }}>
        {value.toLocaleString("vi-VN")}<span className="text-[12px] font-medium opacity-70 ml-0.5">đ</span>
      </p>
    </div>
  );
}
