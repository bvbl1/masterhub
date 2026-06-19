"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useHomeTranslation } from "@/lib/i18n/useHomeTranslation";

const SECTIONS = [
  { id: "home", labelKey: "header.navHome" },
  { id: "howWorks", labelKey: "header.navHowItWorks" },
  { id: "services", labelKey: "header.navServices" },
  { id: "about", labelKey: "header.navAbout" },
  { id: "reviews", labelKey: "footer.reviews" },
] as const;

/** Tick length grows the closer it is to the active section — like a dial/tuner. */
function tickWidth(distance: number): number {
  if (distance === 0) return 56;
  if (distance === 1) return 42;
  if (distance === 2) return 30;
  return 22;
}

export default function SectionRail() {
  const { t } = useHomeTranslation();
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const referenceLine = window.innerHeight * 0.4;

      // Bottom of page → always the last section (footer/reviews may be short).
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      if (atBottom) {
        setActiveId(SECTIONS[SECTIONS.length - 1].id);
        return;
      }

      // Otherwise: the last section whose top has crossed the reference line.
      let current: string = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= referenceLine) current = s.id;
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const activeIndex = SECTIONS.findIndex((s) => s.id === activeId);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <nav
      aria-label="Sections"
      className="fixed right-4 xl:right-8 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-4 lg:flex perspective-[700px] transform-3d"
    >
      {SECTIONS.map((s, i) => {
        const isActive = s.id === activeId;
        const isHovered = hoveredId === s.id;
        const showLabel = isActive || isHovered;
        const signed = activeIndex < 0 ? 0 : i - activeIndex;
        const distance = Math.abs(signed);

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => goTo(s.id)}
            onMouseEnter={() => setHoveredId(s.id)}
            onMouseLeave={() =>
              setHoveredId((prev) => (prev === s.id ? null : prev))
            }
            aria-current={isActive ? "true" : undefined}
            aria-label={t(s.labelKey)}
            className="group relative flex h-3.5 items-center justify-end outline-none transform-3d"
          >
            <AnimatePresence>
              {showLabel ? (
                <motion.span
                  initial={reduceMotion ? false : { opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, x: 10 }}
                  transition={{ duration: 0.18 }}
                  className={`pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-lg px-2.5 py-1 text-sm font-semibold shadow-sm backdrop-blur ${
                    isActive
                      ? "bg-[#486284] text-white"
                      : "bg-white/90 text-[#3d526d]"
                  }`}
                >
                  {t(s.labelKey)}
                </motion.span>
              ) : null}
            </AnimatePresence>

            <motion.span
              className="block h-[5px] rounded-full origin-right"
              style={{ transformPerspective: 700 }}
              animate={{
                width: tickWidth(distance),
                z: reduceMotion ? 0 : -distance * 34,
                scale: 1 - Math.min(distance, 3) * 0.07,
                opacity: isActive ? 1 : Math.max(0.55, 1.9 - distance * 0.18),
                backgroundColor: isActive
                  ? "#486284"
                  : isHovered
                    ? "#7e93ad"
                    : "#cbd5e1",
              }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
            />
          </button>
        );
      })}
    </nav>
  );
}
