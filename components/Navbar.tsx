"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Map, BookHeart, Languages } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useTranslation();

  const navItems = [
    { href: "/", icon: Compass, label: t("navbar.explore") },
    { href: "/itinerary", icon: Map, label: t("navbar.itinerary") },
    { href: "/memories", icon: BookHeart, label: t("navbar.journal") },
  ];

  const toggleLanguage = () => {
    setLanguage(language === "vi" ? "en" : "vi");
  };

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none pb-[max(env(safe-area-inset-bottom),12px)]"
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.05 }}
        className="glass-panel pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-full shadow-[0_10px_28px_rgba(20,38,20,0.18)]"
        style={{ background: "rgba(12,23,12,0.82)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className="relative flex items-center gap-2 px-3.5 py-2.5 rounded-full transition-colors"
            >
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: "var(--accent-leaf)" }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <Icon
                  className="w-[18px] h-[18px]"
                  color={isActive ? "var(--nature-900)" : "rgba(255,255,255,0.75)"}
                  strokeWidth={2.2}
                />
                <span
                  className="text-[13px] font-semibold leading-none whitespace-nowrap"
                  style={{ color: isActive ? "var(--nature-900)" : "rgba(255,255,255,0.75)" }}
                >
                  {label}
                </span>
              </span>
            </Link>
          );
        })}

        {/* Language Toggle next to memories */}
        <button
          onClick={toggleLanguage}
          className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all active:scale-90 ml-1"
          style={{ background: "rgba(255,255,255,0.1)" }}
          aria-label="Toggle language"
        >
          <span className="text-lg">
            {language === "vi" ? "🇻🇳" : "🇺🇸"}
          </span>
        </button>
      </motion.div>
    </nav>
  );
}
