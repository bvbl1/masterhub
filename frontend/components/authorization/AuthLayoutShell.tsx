"use client";

import type { ReactNode } from "react";
import LangSwitcher from "@/components/common/LangSwitcher";
import { motion } from "framer-motion";

export default function AuthLayoutShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#f4f6f9] sm:bg-gradient-to-br sm:from-slate-50 sm:via-white sm:to-[#486284]/5">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#486284]/10 blur-3xl"
        animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.06, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#3A5B22]/8 blur-3xl"
        animate={{ opacity: [0.4, 0.7, 0.4], x: [0, 12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="absolute top-4 right-4 z-30 sm:top-6 sm:right-6">
        <LangSwitcher />
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col items-stretch justify-center">
        {children}
      </div>
    </div>
  );
}
