"use client";

import RegistrationForm from "@/components/authorization/RegistrationForm";
import { useAuthTranslation } from "@/lib/i18n/useAuthTranslation";
import { slideInLeft, slideInRight } from "@/lib/motion/presets";
import { motion } from "framer-motion";
import Image from "next/image";

export default function RegistrationPage() {
  const { t } = useAuthTranslation();
  return (
    <div className="flex min-h-dvh h-full w-full max-w-[1539px] mx-auto flex-col md:flex-row items-stretch justify-center md:justify-center md:py-4 md:px-2">
      <motion.div
        variants={slideInLeft}
        initial="hidden"
        animate="show"
        className="flex w-full md:w-[48%] md:max-w-[50%] shrink-0 items-center justify-center px-4 py-8 sm:px-6 sm:pb-24 md:pr-8 md:py-4 order-2 md:order-0"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="w-full rounded-2xl bg-white/80 p-1 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur-sm md:bg-transparent md:p-0 md:shadow-none md:ring-0"
        >
          <RegistrationForm />
        </motion.div>
      </motion.div>

      <motion.div
        variants={slideInRight}
        initial="hidden"
        animate="show"
        className="hidden md:flex md:w-[52%] shrink-0 md:min-h-[min(560px,calc(100dvh-2rem))]"
      >
        <div className="relative w-full flex-1 min-h-[min(560px,calc(100dvh-2rem))] overflow-hidden md:rounded-l-4xl md:shadow-2xl md:shadow-slate-300/40">
          <Image
            fill
            src="/register-img.png"
            className="object-cover outline-0 ring-0 border-0"
            unoptimized
            alt=""
            sizes="52vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3A5B22]/45 via-transparent to-transparent" />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="absolute bottom-8 left-8 right-8 text-white"
          >
            <p className="text-sm font-medium text-white/80">MasterHub</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight drop-shadow-sm">
              {t("register.heroCaption")}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
