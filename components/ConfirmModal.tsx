"use client";

import { Button } from "./ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "default",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>
        <div className="p-4 bg-gray-50 flex flex-row-reverse gap-3">
          <Button
            onClick={onConfirm}
            variant={variant === "destructive" ? "destructive" : "default"}
            className="px-6"
          >
            {confirmText}
          </Button>
          <Button
            onClick={onCancel}
            variant="ghost"
            className="px-6"
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
}
