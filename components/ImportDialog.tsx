"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/ToastContext";
import { addItineraryItems } from "@/lib/firestore";
import { parseItineraryExcel } from "@/lib/excel-import";
import {
  FileSpreadsheet,
  Download,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface Props {
  tripId: string;
  onClose: () => void;
}

type Step = "idle" | "preview" | "importing" | "done";

export function ImportDialog({ tripId, onClose }: Props) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [result, setResult] = useState<{
    items: Awaited<ReturnType<typeof parseItineraryExcel>>["items"];
    errors: string[];
    total: number;
  } | null>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    try {
      const buf = await f.arrayBuffer();
      const parsed = parseItineraryExcel(buf, tripId);
      setResult(parsed);
      setStep("preview");
    } catch (err) {
      toast.error("Không đọc được file: " + (err as Error).message);
    }
  };

  const handleImport = async () => {
    if (!result || result.items.length === 0) return;
    setStep("importing");
    try {
      await addItineraryItems(tripId, result.items as any);
      toast.success(`Đã import ${result.total} hoạt động thành công!`);
      setStep("done");
    } catch (err) {
      toast.error("Import thất bại: " + (err as Error).message);
      setStep("preview");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Import lịch trình từ Excel</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Step 1: Download template */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <div className="flex-1">
              <p className="font-medium text-blue-900 text-sm">Tải file template</p>
              <p className="text-xs text-blue-700 mt-0.5">Điền dữ liệu vào file mẫu rồi upload lên</p>
              <a
                href="/templates/itinerary_template.xlsx"
                download
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Tải template Excel
              </a>
            </div>
          </div>

          {/* Step 2: Upload file */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-shrink-0 w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">Upload file đã điền</p>
              <p className="text-xs text-gray-500 mt-0.5">Chấp nhận file .xlsx hoặc .xls</p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {file ? file.name : "Chọn file..."}
              </button>
            </div>
          </div>

          {/* Preview */}
          {step === "preview" && result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800 font-medium">
                  Đọc được <strong>{result.total}</strong> hoạt động từ file
                </p>
              </div>

              {result.errors.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-yellow-800">
                      {result.errors.length} hàng bỏ qua
                    </p>
                  </div>
                  <ul className="text-xs text-yellow-700 space-y-0.5 ml-6 list-disc">
                    {result.errors.slice(0, 5).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>...và {result.errors.length - 5} lỗi khác</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Preview first 5 items */}
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y text-xs">
                {result.items.slice(0, 8).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2">
                    <span className="w-5 h-5 flex-shrink-0 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                      {item.day}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.activity || item.location}</p>
                      <p className="text-gray-500 truncate">{item.location} · {item.time}</p>
                    </div>
                    <span className="text-gray-500 flex-shrink-0">
                      {item.estimatedPrice.amount} {item.estimatedPrice.currency}
                    </span>
                  </div>
                ))}
                {result.items.length > 8 && (
                  <div className="px-3 py-2 text-gray-400 text-center">
                    +{result.items.length - 8} hoạt động khác...
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">Import thành công! Trang sẽ tự cập nhật.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            {step === "done" ? "Đóng" : "Hủy"}
          </Button>
          {step === "preview" && result && result.total > 0 && (
            <Button
              onClick={handleImport}
              disabled={step !== "preview"}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Import {result.total} hoạt động
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
