"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, scaleIn, slideInRight, staggerContainer } from "@/lib/motion/presets";
import { useHomeTranslation } from "@/lib/i18n/useHomeTranslation";

export default function AboutSection() {
  const { t } = useHomeTranslation();
  const reduceMotion = useReducedMotion();

  const features = [
    {
      title: t("about.feature1Title"),
      text: t("about.feature1Text"),
      icon: "/aboutus1.png",
    },
    {
      title: t("about.feature2Title"),
      text: t("about.feature2Text"),
      icon: "/aboutus2.png",
    },
    {
      title: t("about.feature3Title"),
      text: t("about.feature3Text"),
      icon: "/aboutus3.png",
    },
  ];

  return (
    <section
      id="about"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24 scroll-mt-16 lg:scroll-mt-24"
    >
      <motion.div
        className="text-center max-w-[720px] mx-auto mb-8 sm:mb-12 lg:mb-16"
        variants={fadeUp}
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "show"}
        viewport={{ once: true, amount: 0.5 }}
      >
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#1A202C] mb-4 sm:mb-6">
          {t("about.title")}
        </h2>
        <p className="leading-relaxed text-sm sm:text-base text-[#1A202C]/75">
          {t("about.intro")}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
        <motion.div
          className="relative w-full h-[240px] sm:h-[320px] lg:h-[420px] rounded-2xl overflow-hidden order-1 lg:order-none"
          variants={scaleIn}
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "show"}
          viewport={{ once: true, amount: 0.25 }}
        >
          <Image
            src="/aboutUs.png"
            alt={t("about.imageAlt")}
            fill
            className="object-cover"
            unoptimized
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </motion.div>

        <motion.div
          className="flex flex-col gap-6 sm:gap-8 lg:gap-10 order-2"
          variants={staggerContainer}
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "show"}
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={slideInRight}>
              <Feature {...f} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Feature({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: string;
}) {
  return (
    <div className="flex gap-4 p-4 sm:p-0 rounded-2xl sm:rounded-none bg-white/60 sm:bg-transparent">
      <div className="shrink-0">
        <Image
          src={icon}
          width={40}
          height={40}
          alt=""
          className="w-11 h-11 sm:w-10 sm:h-10 p-2.5 bg-[#C4C4C4] rounded-xl object-contain"
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base sm:text-lg font-semibold text-[#1A202C] mb-1.5 sm:mb-2">
          {title}
        </h3>
        <p className="text-sm sm:text-base text-[#1A202C]/75 leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  );
}
