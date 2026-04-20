"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadPlacePhoto, compressImage } from "@/lib/storage";

interface PhotoUploadProps {
  placeId: string;
  onPhotoUploaded: (url: string) => void;
  isLoading?: boolean;
}

export function PhotoUpload({
  placeId,
  onPhotoUploaded,
  isLoading,
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      const compressed = await compressImage(file);
      const compressedFile = new File([compressed], file.name, {
        type: "image/jpeg",
      });
      const url = await uploadPlacePhoto(placeId, compressedFile);
      onPhotoUploaded(url);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Upload failed:", error);
      const err = error as { code?: string; message?: string };
      const msg = err?.code === "storage/unauthorized"
        ? "Lỗi quyền truy cập Storage. Cần cập nhật Firebase Storage Rules."
        : `Upload thất bại: ${err?.message || "Lỗi không xác định"}`;
      setUploadError(msg);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Xem trước"
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : null}

      {uploadError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{uploadError}</p>
      )}

      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || isLoading}
        variant="outline"
        className="w-full"
      >
        <Upload className="w-4 h-4 mr-2" />
        {uploading ? "Đang tải lên..." : "Tải ảnh lên"}
      </Button>
    </div>
  );
}
