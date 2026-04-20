"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { ItineraryItem } from "@/types/index";
import { addItineraryItems, sortDayByTime } from "@/lib/firestore";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Props {
  day: number;
  order: number;
  date: string;
  existingItems: ItineraryItem[];
  onClose: () => void;
}

const CURRENCIES = ["SGD", "MYR", "VND", "USD", "EUR", "THB", "JPY"];

const inputCls =
  "w-full px-3 py-3 text-base border border-gray-200 rounded-xl bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent " +
  "hover:border-gray-300 transition-colors placeholder:text-gray-400";

const inputErrCls =
  "w-full px-3 py-3 text-base border border-red-400 rounded-xl bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent " +
  "transition-colors placeholder:text-gray-400";

const labelCls = "block text-sm font-medium text-gray-600 mb-1.5";

/** "29/04/2026" → "2026-04-29" (no-op if already ISO) */
function toInputDate(d: string): string {
  if (!d) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const parts = d.split("/");
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
}

function timeToMins(t: string): number {
  if (!t) return -1;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function addMins(t: string, mins: number): string {
  const total = Math.min(timeToMins(t) + mins, 23 * 60 + 59);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type OccupiedSlot = { start: number; end: number; label: string };

function getOccupied(items: ItineraryItem[]): OccupiedSlot[] {
  return items.flatMap((item) => {
    if (!item.time) return [];
    const parts = item.time.split("–");
    const s = timeToMins(parts[0]?.trim());
    const e = parts[1] ? timeToMins(parts[1].trim()) : s + 60;
    if (s < 0) return [];
    return [{ start: s, end: e, label: item.activity }];
  });
}

function getLatestEnd(items: ItineraryItem[]): string {
  let latest = -1;
  let result = "";
  items.forEach((item) => {
    if (!item.time) return;
    const parts = item.time.split("–");
    const endStr = (parts[parts.length - 1] ?? "").trim();
    const mins = timeToMins(endStr);
    if (mins > latest) { latest = mins; result = endStr; }
  });
  return result;
}

function checkOverlap(start: string, end: string, occupied: OccupiedSlot[]): boolean {
  if (!start || !end) return false;
  const ns = timeToMins(start);
  const ne = timeToMins(end);
  if (ns >= ne) return false;
  return occupied.some(({ start: s, end: e }) => ns < e && s < ne);
}

// Timeline covers 06:00 → 24:00
const T_START = 6 * 60;
const T_END = 24 * 60;
const T_RANGE = T_END - T_START;

function toPercent(mins: number) {
  return Math.max(0, Math.min(100, ((mins - T_START) / T_RANGE) * 100));
}

export function CreateItemModal({ day, order, date, existingItems, onClose }: Props) {
  const params = useParams();
  const tripId = params?.tripId as string;
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const latestEnd = useMemo(() => getLatestEnd(existingItems), [existingItems]);

  const [form, setForm] = useState({
    activity: "",
    location: "",
    date: toInputDate(date),
    startTime: latestEnd,
    endTime: latestEnd ? addMins(latestEnd, 60) : "",
    amount: "",
    currency: "SGD",
    category: "other",
    mapUrl: "",
    notes: "",
  });

  const occupied = useMemo(() => getOccupied(existingItems), [existingItems]);

  const invalidRange =
    !!form.startTime && !!form.endTime &&
    timeToMins(form.startTime) >= timeToMins(form.endTime);

  const hasOverlap = useMemo(
    () => !invalidRange && checkOverlap(form.startTime, form.endTime, occupied),
    [form.startTime, form.endTime, occupied, invalidRange]
  );

  const timeError = invalidRange
    ? "Giờ kết thúc phải sau giờ bắt đầu."
    : hasOverlap
    ? "⚠️ Khoảng giờ này trùng với hoạt động khác trong ngày."
    : null;

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setForm((prev) => ({
      ...prev,
      startTime: newStart,
      endTime: newStart ? addMins(newStart, 60) : prev.endTime,
    }));
  };

  const handleSave = async () => {
    if (!form.activity.trim() || !form.location.trim()) {
      toast.error("Hoạt động và địa điểm không được để trống.");
      return;
    }
    if (invalidRange) {
      toast.error("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }
    if (hasOverlap) {
      toast.error("Khoảng giờ này trùng với hoạt động khác trong ngày.");
      return;
    }
    setSaving(true);
    try {
      const s = form.startTime.trim();
      const e = form.endTime.trim();
      const timeStr = s && e ? `${s}–${e}` : s || e || "";
      const newItem: Omit<ItineraryItem, "id" | "tripId"> = {
        day,
        date: form.date.trim(),
        time: timeStr,
        location: form.location.trim(),
        activity: form.activity.trim(),
        estimatedPrice: {
          amount: parseFloat(form.amount) || 0,
          currency: form.currency as ItineraryItem["estimatedPrice"]["currency"],
        },
        visited: false,
        notes: form.notes.trim(),
        order,
        mapUrl: form.mapUrl.trim() || undefined,
        category: form.category as ItineraryItem["category"],
      };
      await addItineraryItems(tripId, [newItem]);
      await sortDayByTime(day);
      toast.success("Đã thêm hoạt động mới.");
      onClose();
    } catch (err) {
      console.error("[ERROR] addItineraryItems:", err);
      toast.error("Tạo mới thất bại, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const newSlotStart = timeToMins(form.startTime);
  const newSlotEnd = timeToMins(form.endTime);
  const showNewSlot = newSlotStart >= 0 && newSlotEnd > newSlotStart;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92dvh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-10 h-1 bg-gray-200 rounded-full sm:hidden" />
          <h2 className="text-lg font-bold text-gray-900">Thêm hoạt động</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
          {/* Activity */}
          <div>
            <label className={labelCls}>Hoạt động <span className="text-red-400">*</span></label>
            <input type="text" value={form.activity} onChange={set("activity")}
              className={inputCls} placeholder="Tên hoạt động" autoComplete="off" />
          </div>

          {/* Location */}
          <div>
            <label className={labelCls}>Địa điểm <span className="text-red-400">*</span></label>
            <input type="text" value={form.location} onChange={set("location")}
              className={inputCls} placeholder="Tên địa điểm" autoComplete="off" />
          </div>

          {/* Price + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Chi phí dự toán</label>
              <input type="number" inputMode="decimal" step="0.01" min="0"
                value={form.amount} onChange={set("amount")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>Đơn vị tiền</label>
              <select value={form.currency} onChange={set("currency")} className={inputCls}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className={labelCls}>Ngày</label>
            <input type="date" value={form.date} onChange={set("date")}
              className={inputCls} autoComplete="off" />
          </div>

          {/* Start time */}
          <div>
            <label className={labelCls}>Giờ bắt đầu</label>
            <input type="time" value={form.startTime} onChange={handleStartChange}
              className={timeError ? inputErrCls : inputCls} autoComplete="off" />
          </div>

          {/* End time */}
          <div>
            <label className={labelCls}>Giờ kết thúc</label>
            <input type="time" value={form.endTime} onChange={set("endTime")}
              className={timeError ? inputErrCls : inputCls} autoComplete="off" />
          </div>

          {/* Time error */}
          {timeError && (
            <p className="text-red-500 text-sm !mt-1.5">{timeError}</p>
          )}

          {/* ── Mini timeline ── */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Timeline Ngày {day}
            </p>
            <div className="relative h-5 bg-gray-200 rounded-full overflow-hidden">
              {/* Existing slots */}
              {occupied.map((slot, i) => (
                <div
                  key={i}
                  className="absolute h-full"
                  title={slot.label}
                  style={{
                    left: `${toPercent(slot.start)}%`,
                    width: `${Math.max(toPercent(slot.end) - toPercent(slot.start), 0.5)}%`,
                    background: "#fb923c",
                    borderRadius: "2px",
                  }}
                />
              ))}
              {/* New slot preview */}
              {showNewSlot && (
                <div
                  className="absolute h-full opacity-90"
                  style={{
                    left: `${toPercent(newSlotStart)}%`,
                    width: `${Math.max(toPercent(newSlotEnd) - toPercent(newSlotStart), 0.5)}%`,
                    background: hasOverlap ? "#ef4444" : "#3b82f6",
                    borderRadius: "2px",
                  }}
                />
              )}
            </div>
            {/* Hour labels */}
            <div className="flex justify-between text-[9px] text-gray-400 mt-1 px-0.5">
              {[6, 9, 12, 15, 18, 21, 24].map((h) => (
                <span key={h}>{String(h).padStart(2, "0")}h</span>
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="w-3 h-2 rounded-sm bg-orange-400 inline-block" />
                Đã có
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className={`w-3 h-2 rounded-sm inline-block ${hasOverlap ? "bg-red-500" : "bg-blue-500"}`} />
                {hasOverlap ? "Trùng lịch!" : "Hoạt động mới"}
              </span>
            </div>
          </div>

          {/* Google Maps */}
          <div>
            <label className={labelCls}>Link Google Maps</label>
            <input type="url" inputMode="url" value={form.mapUrl} onChange={set("mapUrl")}
              className={inputCls} placeholder="https://maps.google.com/..." autoComplete="off" />
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Ghi chú / Hướng dẫn</label>
            <textarea value={form.notes} onChange={set("notes")} rows={3}
              className={`${inputCls} resize-none`} placeholder="Tip, hướng dẫn, ghi chú bổ sung..." />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1 h-12 text-base">
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 h-12 text-base">
            {saving ? "Đang lưu..." : "Tạo mới"}
          </Button>
        </div>
      </div>
    </div>
  );
}
