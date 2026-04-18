"use client";

import { useState } from "react";
import { ItineraryItem } from "@/types/index";
import { addItineraryItems } from "@/lib/firestore";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Props {
  day: number;
  order: number;
  date: string;
  onClose: () => void;
}

const CATEGORIES = [
  { value: "food", label: "🍜 Ăn uống" },
  { value: "place", label: "📍 Địa điểm" },
  { value: "transport", label: "🚌 Di chuyển" },
  { value: "other", label: "✦ Khác" },
] as const;

const CURRENCIES = ["SGD", "MYR", "VND", "USD", "EUR", "THB", "JPY"];

const inputCls =
  "w-full px-3 py-3 text-base border border-gray-200 rounded-xl bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent " +
  "hover:border-gray-300 transition-colors placeholder:text-gray-400";

const labelCls = "block text-sm font-medium text-gray-600 mb-1.5";

export function CreateItemModal({ day, order, date, onClose }: Props) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    activity: "",
    location: "",
    date: date,
    startTime: "",
    endTime: "",
    amount: "",
    currency: "SGD",
    category: "other",
    mapUrl: "",
    notes: "",
  });

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.activity.trim() || !form.location.trim()) {
      toast.error("Hoạt động và địa điểm không được để trống.");
      return;
    }
    if (!form.startTime.trim() || !form.endTime.trim()) {
      toast.error("Vui lòng nhập đủ giờ bắt đầu và kết thúc.");
      return;
    }
    setSaving(true);
    try {
      const newItem: Omit<ItineraryItem, "id"> = {
        tripId: "sg-my-2026", // TODO: dynamic tripId if needed
        day,
        date: form.date.trim(),
        time: `${form.startTime.trim()}–${form.endTime.trim()}`,
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
      await addItineraryItems([newItem]);
      toast.success("Đã thêm hoạt động mới.");
      onClose();
    } catch (err) {
      console.error("[ERROR] addItineraryItems:", err);
      toast.error("Tạo mới thất bại, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92dvh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
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
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
          <div>
            <label className={labelCls}>Hoạt động <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.activity}
              onChange={set("activity")}
              className={inputCls}
              placeholder="Tên hoạt động"
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelCls}>Địa điểm <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.location}
              onChange={set("location")}
              className={inputCls}
              placeholder="Tên địa điểm"
              autoComplete="off"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Chi phí dự toán</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={set("amount")}
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelCls}>Đơn vị tiền</label>
              <select value={form.currency} onChange={set("currency")} className={inputCls}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Ngày</label>
              <input
                type="date"
                value={form.date}
                onChange={set("date")}
                className={inputCls}
                autoComplete="off"
              />
            </div>
            <div>
              <label className={labelCls}>Giờ bắt đầu</label>
              <input
                type="time"
                value={form.startTime}
                onChange={set("startTime")}
                className={inputCls}
                autoComplete="off"
              />
            </div>
            <div>
              <label className={labelCls}>Giờ kết thúc</label>
              <input
                type="time"
                value={form.endTime}
                onChange={set("endTime")}
                className={inputCls}
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Link Google Maps</label>
            <input
              type="url"
              inputMode="url"
              value={form.mapUrl}
              onChange={set("mapUrl")}
              className={inputCls}
              placeholder="https://maps.google.com/..."
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelCls}>Ghi chú / Hướng dẫn</label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Tip, hướng dẫn, ghi chú bổ sung..."
            />
          </div>
        </div>
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
