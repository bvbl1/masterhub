"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import {
  fadeUp,
  scaleIn,
  slideInLeft,
  slideInRight,
} from "@/lib/motion/presets";

export type HomeRevealVariant = "fadeUp" | "slideInLeft" | "slideInRight" | "scaleIn";

const VARIANT_MAP = {
  fadeUp,
  slideInLeft,
  slideInRight,
  scaleIn,
} as const;

type HomeSectionRevealProps = {
  children: ReactNode;
  className?: string;
  /** Play on mount (hero) instead of waiting for scroll. */
  eager?: boolean;
  variant?: HomeRevealVariant;
};

export default function HomeSectionReveal({
  children,
  className,
  eager = false,
  variant = "fadeUp",
}: HomeSectionRevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={VARIANT_MAP[variant]}
      initial="hidden"
      {...(eager
        ? { animate: "show" }
        : {
            whileInView: "show",
            viewport: { once: true, amount: 0.12, margin: "-40px 0px" },
          })}
    >
      {children}
    </motion.div>
  );
}
