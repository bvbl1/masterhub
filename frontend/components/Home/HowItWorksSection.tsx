"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion/presets";
import { useHomeTranslation } from "@/lib/i18n/useHomeTranslation";

const steps = [
  { icon: "/map-icon.png", titleKey: "step1Title", textKey: "step1Text" },
  { icon: "/icon2.png", titleKey: "step2Title", textKey: "step2Text" },
  { icon: "/icon3.png", titleKey: "step3Title", textKey: "step3Text" },
] as const;

const CONNECTOR_PATH =
  "M0.5 79.5 C 42 87, 72 84.5, 96.5 76.5 C 121 68.5, 140 55.3, 160.7 42.3 C 181 29.2, 203 16.2, 233 8.4 C 263 0.6, 301 -2, 354.6 5.5";

function ConnectorArrow({
  index,
  reduceMotion,
}: {
  index: number;
  reduceMotion: boolean;
}) {
  const drawDuration = 1.1;
  const delay = 0.15 + index * 0.25;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="300"
      height="85"
      viewBox="-4 -6 366 97"
      fill="none"
      className="absolute hidden lg:block top-8 -right-32 xl:-right-40 pointer-events-none overflow-visible"
      aria-hidden
    >
      <motion.path
        d={CONNECTOR_PATH}
        stroke="#1A202C"
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
        initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
        whileInView={reduceMotion ? undefined : { pathLength: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: drawDuration, ease: [0.22, 1, 0.36, 1], delay }}
      />
      {/* Arrowhead fades in once the line reaches the end */}
    </svg>
  );
}

export default function HowItWorksSection() {
  const { t } = useHomeTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <section id="howWorks" className="scroll-mt-16 lg:scroll-mt-24">
      <div className="w-full py-12 sm:py-16 lg:mt-5 flex justify-center px-4 sm:px-6">
        <div className="w-full max-w-[1300px]">
          <motion.div
            className="w-full flex flex-col items-center"
            variants={fadeUp}
            initial={reduceMotion ? false : "hidden"}
            whileInView={reduceMotion ? undefined : "show"}
            viewport={{ once: true, amount: 0.4 }}
          >
            <h2 className="text-[#486284] text-2xl sm:text-4xl lg:text-5xl font-semibold text-center leading-tight px-2">
              {t("howItWorks.title")}
            </h2>
            <p className="max-w-[520px] text-center mt-4 sm:mt-6 text-[#1A202C] text-sm sm:text-base leading-relaxed">
              {t("howItWorks.subtitle")}
            </p>
          </motion.div>

          <motion.div
            className="mt-10 sm:mt-14 lg:mt-20 flex flex-col gap-2 sm:gap-4 lg:grid lg:grid-cols-3 lg:gap-8"
            variants={staggerContainer}
            initial={reduceMotion ? false : "hidden"}
            whileInView={reduceMotion ? undefined : "show"}
            viewport={{ once: true, amount: 0.15 }}
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.titleKey}
                variants={fadeUp}
                className="relative flex flex-col items-center"
              >
                <div className="w-full flex max-w-[320px] sm:max-w-[276px] flex-col gap-4 sm:gap-7 items-center text-center py-6 sm:py-8 lg:py-0">
                  <div className="w-20 h-20 sm:w-[106px] sm:h-[106px] bg-[#CED7E4] rounded-[24px] sm:rounded-[30px] flex items-center justify-center shrink-0">
                    <Image
                      src={step.icon}
                      unoptimized
                      height={44}
                      width={44}
                      alt=""
                      className="w-10 h-10 sm:w-[50px] sm:h-[50px] object-contain"
                    />
                  </div>
                  <h4 className="font-semibold text-lg sm:text-2xl">
                    {t(`howItWorks.${step.titleKey}`)}
                  </h4>
                  <p className="text-sm text-[#1A202C]/80 leading-relaxed">
                    {t(`howItWorks.${step.textKey}`)}
                  </p>
                </div>

                {index < steps.length - 1 ? (
                  <ConnectorArrow index={index} reduceMotion={!!reduceMotion} />
                ) : null}

                {index < steps.length - 1 ? (
                  <div
                    className="lg:hidden flex justify-center -my-1 text-[#456186]/35"
                    aria-hidden
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 5v14M5 12l7 7 7-7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                ) : null}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
