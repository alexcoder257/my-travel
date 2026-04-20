"use client";

import { useState } from "react";
import { X, UserPlus, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/ToastContext";
import { updateTripRoles } from "@/lib/firestore";
import { Trip } from "@/types/index";

interface Props {
  trip: Trip;
  onClose: () => void;
}

export function ShareModal({ trip, onClose }: Props) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("viewer");
  const [submitting, setSubmitting] = useState(false);

  const roles = trip.roles || {};

  const handleInvite = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Vui lòng nhập email hợp lệ");
      return;
    }
    setSubmitting(true);
    try {
      await updateTripRoles(trip.id, email, role);
      toast.success(`Đã mời ${email} với quyền ${role}`);
      setEmail("");
      // Logic để cập nhật state cục bộ nếu cần,
      // nhưng thường onSnapshot ở TripDataContext sẽ lo việc này.
    } catch (err) {
      console.error(err);
      toast.error("Không thể thêm người dùng");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (targetEmail: string) => {
    try {
      // Firebase keys back to real email
      const realEmail = targetEmail.replace(/_/g, ".");
      await updateTripRoles(trip.id, realEmail, null);
      toast.success("Đã xóa người dùng");
    } catch (err) {
      console.error(err);
      toast.error("Không thể xóa");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Chia sẻ chuyến đi</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Add collaborator form */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Mời qua Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
                className="px-2 py-2 border border-gray-300 rounded-xl bg-gray-50 text-xs font-semibold outline-none"
              >
                <option value="viewer">View</option>
                <option value="editor">Edit</option>
              </select>
            </div>
            <Button
              onClick={handleInvite}
              disabled={submitting || !email}
              className="w-full h-10 rounded-xl font-bold"
            >
              {submitting ? "Đang mời..." : "Gửi lời mời"}
            </Button>
          </div>

          {/* List existing collaborators */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Người có quyền truy cập
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">Chủ sở hữu</p>
                  <p className="text-xs text-gray-500 truncate">{trip.ownerId}</p>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                  OWNER
                </span>
              </div>

              {Object.entries(roles).map(([safeEmail, r]) => (
                <div key={safeEmail} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {safeEmail.replace(/_/g, ".")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      r === 'editor' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {r}
                    </span>
                    <button
                      onClick={() => handleRemove(safeEmail)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
