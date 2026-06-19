"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { HiArrowRight } from "react-icons/hi2";
import { fadeUp, slideInLeft, staggerContainer } from "@/lib/motion/presets";
import { useHomeTranslation } from "@/lib/i18n/useHomeTranslation";

function JoinButton({ label }: { label: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="w-full sm:w-auto"
      whileHover={reduceMotion ? undefined : { y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
    >
      <Link
        href="/registration"
        className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg sm:rounded-none bg-[#486284] px-7 py-3.5 sm:py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#3d526d]"
      >
        <span>{label}</span>
        <HiArrowRight
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden
        />
      </Link>
    </motion.div>
  );
}

function HeroText({ animated }: { animated: boolean }) {
  const { t } = useHomeTranslation();

  const Eyebrow = animated ? motion.p : "p";
  const Title = animated ? motion.h2 : "h2";
  const Body = animated ? motion.p : "p";
  const CtaRow = animated ? motion.div : "div";
  const itemProps = animated ? { variants: fadeUp } : {};

  return (
    <>
      <Title
        {...itemProps}
        className="mt-3 sm:mt-4 lg:mt-[19px] text-[1.625rem] leading-tight sm:text-3xl lg:text-[40px] font-extrabold"
      >
        {t("hero.title")}
      </Title>
      <Body
        {...itemProps}
        className="mt-3 sm:mt-4 lg:mt-5 text-sm sm:text-base text-[#1A202C]/70 font-medium leading-relaxed max-w-[540px]"
      >
        {t("hero.body")}
      </Body>
      <CtaRow
        {...itemProps}
        className="mt-6 sm:mt-8 lg:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
      >
        <JoinButton label={t("hero.joinCta")} />
        <Link
          className="flex w-full sm:w-auto items-center justify-center rounded-lg sm:rounded-none bg-white px-6 py-3.5 sm:py-3 text-base font-semibold text-[#1A202C] shadow-sm sm:shadow-none transition-colors hover:bg-slate-50 active:bg-slate-100"
          href="#services"
        >
          {t("hero.cta")}
        </Link>
      </CtaRow>
    </>
  );
}

function HeroImage({ animated }: { animated: boolean }) {
  const { t } = useHomeTranslation();

  const img = (
    <Image
      src="/main-section-img.png"
      alt={t("hero.imageAlt")}
      width={800}
      height={600}
      className="w-full h-full min-h-[220px] sm:min-h-[320px] lg:min-h-full object-cover rounded-b-3xl lg:rounded-none lg:rounded-tl-[63px]"
      unoptimized
      priority
      sizes="(max-width: 1024px) 100vw, 53vw"
    />
  );

  if (!animated) return img;

  return (
    <motion.div
      className="relative h-full w-full"
      initial={{
        opacity: 0,
        scale: 1.08,
        clipPath: "inset(0 0 0 100%)",
      }}
      animate={{
        opacity: 1,
        scale: 1,
        clipPath: "inset(0 0 0 0%)",
      }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
    >
      {img}
    </motion.div>
  );
}

export default function HomeSection() {
  const reduceMotion = useReducedMotion();
  const animated = !reduceMotion;

  return (
    <section
      id="home"
      className="w-full flex justify-center bg-[#CED7E4] scroll-mt-16 lg:scroll-mt-0 lg:pt-[100px] lg:min-h-[833px]"
    >
      <div className="max-w-[1440px] w-full flex flex-col lg:flex-row overflow-hidden">
        {animated ? (
          <motion.div
            className="w-full lg:w-[47%] order-2 lg:order-1"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div
              variants={slideInLeft}
              className="px-4 sm:px-8 lg:pl-[66px] py-8 sm:py-10 lg:pt-[77px] lg:pb-12 text-black"
            >
              <HeroText animated />
            </motion.div>
          </motion.div>
        ) : (
          <div className="w-full lg:w-[47%] order-2 lg:order-1 px-4 sm:px-8 lg:pl-[66px] py-8 sm:py-10 lg:pt-[77px] lg:pb-12 text-black">
            <HeroText animated={false} />
          </div>
        )}

        <div className="w-full lg:w-[53%] order-1 lg:order-2 relative min-h-[220px] sm:min-h-[300px] lg:min-h-[733px]">
          <HeroImage animated={animated} />
        </div>
      </div>
    </section>
  );
}
