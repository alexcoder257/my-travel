"use client";

import { motion } from "framer-motion";
import { Compass } from "lucide-react";

export function TripLoader({ label = "Đang tải chuyến đi…" }: { label?: string }) {
  return (
    <div
      className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-8 text-center"
      style={{ background: "var(--surface-body)" }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="relative w-[96px] h-[96px] rounded-full grid place-items-center"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, var(--nature-100), var(--nature-300))",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <motion.span
          className="absolute inset-[-6px] rounded-full"
          style={{ border: "2px dashed var(--nature-400)" }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
        />
        <motion.div
          animate={{ rotate: [0, 15, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
        >
          <Compass className="w-10 h-10" style={{ color: "var(--nature-800)" }} strokeWidth={2.2} />
        </motion.div>
      </motion.div>

      <div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-[15px] font-semibold"
          style={{ color: "var(--nature-900)" }}
        >
          {label}
        </motion.p>
        <motion.div
          className="mt-3 h-1 w-36 mx-auto rounded-full overflow-hidden"
          style={{ background: "var(--sand-200)" }}
        >
          <motion.div
            className="h-full w-1/2 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, var(--nature-500), var(--accent-leaf))",
            }}
            animate={{ x: ["-100%", "220%"] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
