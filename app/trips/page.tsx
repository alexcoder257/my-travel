"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getTripsForUser, createTrip } from "@/lib/firestore";
import { Trip } from "@/types/index";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, MapPin, Calendar, ChevronRight, LogOut } from "lucide-react";
import { TripLoader } from "@/components/TripLoader";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { COUNTRIES, getHeroImage } from "@/lib/countries";

function formatDate(d: Date) {
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getTripFlag(countries: string[]) {
  return countries
    .map((c) => COUNTRIES.find((x) => x.code === c)?.flag)
    .filter(Boolean)
    .join(" ");
}

export default function TripsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    getTripsForUser(user.email || "", user.uid)
      .then((data) => { setTrips(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleCreateTrip = async () => {
    if (!user) return;
    setCreating(true);
    try {
      const tripId = `trip-${Date.now()}`;
      const newTrip: Trip = {
        id: tripId,
        name: "Chuyến đi mới",
        countries: ["sg"],
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 3),
        budget: { SGD: 0, MYR: 0 },
        exchangeRates: { SGD: 19000, MYR: 5500 },
        createdAt: new Date(),
        ownerId: user.uid,
      };
      await createTrip(newTrip);
      router.push(`/trip/${tripId}`);
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || loading) return <TripLoader label="Đang tải..." />;

  const avatar = user?.photoURL;
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Traveler";

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--surface-body)" }}>
      {/* ── HEADER ── */}
      <div
        className="sticky top-0 z-20 px-5 pt-[max(env(safe-area-inset-top),18px)] pb-4"
        style={{ background: "var(--surface-body)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div
                className="w-10 h-10 rounded-full grid place-items-center text-white font-bold text-[15px]"
                style={{ background: "var(--nature-600)" }}
              >
                {displayName[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-[11px] font-medium" style={{ color: "var(--surface-muted)" }}>
                Xin chào 👋
              </p>
              <p className="text-[15px] font-bold leading-tight" style={{ color: "var(--nature-900)" }}>
                {displayName}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-9 h-9 rounded-full grid place-items-center transition-colors"
            style={{ background: "var(--sand-100)", color: "var(--surface-muted)" }}
            aria-label="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <h1
          className="mt-5 text-[28px] font-extrabold leading-tight"
          style={{ color: "var(--nature-900)" }}
        >
          Chuyến đi của tôi
        </h1>
      </div>

      {/* ── TRIP LIST ── */}
      <div className="px-5 space-y-3 mt-2">
        {trips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          >
            <div
              className="w-20 h-20 rounded-full grid place-items-center text-4xl"
              style={{ background: "var(--sand-100)" }}
            >
              🗺️
            </div>
            <p className="text-[16px] font-semibold" style={{ color: "var(--nature-900)" }}>
              Chưa có chuyến đi nào
            </p>
            <p className="text-[13px]" style={{ color: "var(--surface-muted)" }}>
              Tạo chuyến đi đầu tiên của bạn ngay bây giờ
            </p>
          </motion.div>
        ) : (
          trips.map((trip, i) => {
            const flag = getTripFlag(trip.countries);
            const hero = getHeroImage(trip.countries);
            const daysLeft = Math.ceil((trip.endDate.getTime() - Date.now()) / 86400000);
            const isOngoing = daysLeft >= 0 && Date.now() >= trip.startDate.getTime();
            const isUpcoming = Date.now() < trip.startDate.getTime();

            return (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 0.68, 0, 1] }}
              >
                <Link
                  href={`/trip/${trip.id}`}
                  className="block rounded-[24px] overflow-hidden shadow-[var(--shadow-md)] active:scale-[0.98] transition-transform"
                  style={{ background: "var(--surface-card)" }}
                >
                  {/* Thumbnail */}
                  <div className="relative h-32 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={hero}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(180deg,transparent 20%,rgba(12,23,12,0.55) 100%)" }}
                    />
                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                      {isOngoing && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                          style={{ background: "var(--accent-leaf)", color: "var(--nature-900)" }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                          Đang diễn ra
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                          style={{ background: "rgba(0,0,0,0.4)" }}>
                          Sắp tới
                        </span>
                      )}
                      {!isOngoing && !isUpcoming && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                          style={{ background: "rgba(0,0,0,0.4)" }}>
                          Đã kết thúc
                        </span>
                      )}
                    </div>
                    {/* Flag + name overlay */}
                    <div className="absolute bottom-3 left-3 text-white">
                      <p className="text-[18px] leading-none">{flag || "🌏"}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-bold text-[16px] leading-snug truncate" style={{ color: "var(--nature-900)" }}>
                        {trip.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: "var(--surface-muted)" }}>
                          <Calendar className="w-3 h-3" />
                          {formatDate(trip.startDate)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: "var(--surface-muted)" }}>
                          <MapPin className="w-3 h-3" />
                          {trip.countries.map(c => c.toUpperCase()).join(", ")}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 flex-shrink-0 ml-2" style={{ color: "var(--sand-400)" }} />
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── CREATE BUTTON ── */}
      <div className="fixed bottom-[calc(88px+env(safe-area-inset-bottom)+16px)] left-0 right-0 px-5 pointer-events-none">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={handleCreateTrip}
          disabled={creating}
          className="pointer-events-auto w-full py-4 rounded-[20px] text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-[var(--shadow-lg)] active:scale-[0.98] transition-transform disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,var(--nature-600),var(--nature-800))" }}
        >
          <Plus className="w-5 h-5" />
          {creating ? "Đang tạo..." : "Tạo chuyến đi mới"}
        </motion.button>
      </div>
    </div>
  );
}
