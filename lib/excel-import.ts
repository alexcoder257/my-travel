import * as XLSX from "xlsx";
import { ItineraryItem } from "@/types/index";

const VALID_CATEGORIES = ["food", "place", "transport", "other"] as const;

type Category = "food" | "place" | "transport" | "other";

function normalizeCategory(val: string): Category {
  const v = (val || "").toLowerCase().trim() as Category;
  return VALID_CATEGORIES.includes(v) ? v : "other";
}

function normalizeCurrency(val: string): "SGD" | "MYR" | "VND" | string {
  return (val || "VND").toUpperCase().trim();
}

export interface ImportResult {
  items: Omit<ItineraryItem, "id">[];
  errors: string[];
  total: number;
}

export function parseItineraryExcel(buffer: ArrayBuffer, tripId: string): ImportResult {
  const wb = XLSX.read(buffer, { type: "array" });

  const sheetName = wb.SheetNames.includes("Lịch trình")
    ? "Lịch trình"
    : wb.SheetNames[0];

  const ws = wb.Sheets[sheetName];
  // Start from row 3 (skip 2 header rows), header: false → raw array
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, range: 2 });

  const items: Omit<ItineraryItem, "id">[] = [];
  const errors: string[] = [];
  // Track order per day
  const dayCounters: Record<number, number> = {};

  rows.forEach((row, idx) => {
    const r = row as unknown[];
    // Skip blank rows
    if (!r[0] && !r[3]) return;

    const rawDay = r[0];
    const day = Number(rawDay);
    if (!rawDay || isNaN(day) || day < 1) {
      errors.push(`Hàng ${idx + 3}: Ngày số "${rawDay}" không hợp lệ — bỏ qua.`);
      return;
    }

    const location = String(r[3] || "").trim();
    if (!location) {
      errors.push(`Hàng ${idx + 3}: Thiếu Địa điểm — bỏ qua.`);
      return;
    }

    if (!dayCounters[day]) dayCounters[day] = 0;

    items.push({
      tripId,
      day,
      date: String(r[1] || "").trim(),
      time: String(r[2] || "").trim(),
      location,
      activity: String(r[4] || location).trim(),
      category: normalizeCategory(String(r[5] || "")),
      estimatedPrice: {
        amount: parseFloat(String(r[6] || "0")) || 0,
        currency: normalizeCurrency(String(r[7] || "VND")) as "SGD" | "MYR" | "VND",
      },
      mapUrl: String(r[8] || "").trim() || undefined,
      notes: String(r[9] || "").trim(),
      visited: false,
      order: dayCounters[day]++,
    });
  });

  return { items, errors, total: items.length };
}
