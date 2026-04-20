"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { user, loginWithGoogle, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  if (loading) return null;

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    try {
      await loginWithGoogle();
      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.message || "Google login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden px-5 py-12"
      style={{ background: "linear-gradient(160deg, var(--nature-900) 0%, var(--nature-700) 50%, var(--nature-800) 100%)" }}
    >
      {/* Background decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-10"
          style={{ background: "var(--accent-leaf)" }} />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-10"
          style={{ background: "var(--accent-sun)" }} />
      </div>

      {/* Top: Logo + tagline */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 0.68, 0, 1] }}
        className="flex flex-col items-center gap-4 mt-8"
      >
        {/* Logo circle */}
        <div className="w-28 h-28 rounded-full bg-white shadow-2xl overflow-hidden flex items-center justify-center"
          style={{ boxShadow: "0 0 0 6px rgba(255,255,255,0.15), 0 20px 60px rgba(0,0,0,0.4)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Roamboo" className="w-28 h-28 object-cover" />
        </div>

        <div className="text-center">
          <h1 className="text-[36px] font-extrabold tracking-tight text-white" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
            Roamboo
          </h1>
          <p className="mt-1 text-white/60 text-[15px] font-medium">
            Travel with love 🐼 ✈️
          </p>
        </div>
      </motion.div>

      {/* Middle: Illustration text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="flex flex-col items-center gap-3 text-center px-4"
      >
        <p className="text-white/80 text-[17px] font-semibold leading-snug">
          Lên kế hoạch chuyến đi,
          <br />theo dõi chi tiêu & lưu kỷ niệm.
        </p>
        <p className="text-white/40 text-[13px]">
          Tất cả trong một ứng dụng dành cho những chuyến đi trọn vẹn.
        </p>
      </motion.div>

      {/* Bottom: Login button */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.55, ease: [0.22, 0.68, 0, 1] }}
        className="w-full flex flex-col gap-4"
      >
        <button
          onClick={handleGoogleLogin}
          disabled={submitting}
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-gray-800 active:scale-[0.97] transition-all disabled:opacity-50"
          style={{
            background: "rgba(255,255,255,0.96)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span className="text-[16px]">
            {submitting ? "Đang đăng nhập..." : "Tiếp tục với Google"}
          </span>
        </button>

        <p className="text-center text-white/30 text-[12px] px-4">
          Khi đăng nhập, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của Roamboo.
        </p>
      </motion.div>
    </div>
  );
}
