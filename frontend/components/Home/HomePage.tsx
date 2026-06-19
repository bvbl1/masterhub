"use client";

import { motion, useReducedMotion } from "framer-motion";
import { easeOut } from "@/lib/motion/presets";
import Footer from "./Footer";
import Header from "./Header";
import AboutSection from "./AboutSection";
import HomeSection from "./HomeSection";
import HowItWorksSection from "./HowItWorksSection";
import ServicesSection from "./ServicesSection";
import TestimonialsSection from "./TestimonialsSection";
import HomeSectionReveal from "./HomeSectionReveal";
import SectionRail from "./SectionRail";

export default function HomePage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="w-full min-w-0">
      <SectionRail />
      {reduceMotion ? (
        <Header />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: easeOut }}
        >
          <Header />
        </motion.div>
      )}

      <HomeSectionReveal eager variant="fadeUp">
        <HomeSection />
      </HomeSectionReveal>

      <HomeSectionReveal variant="fadeUp">
        <HowItWorksSection />
      </HomeSectionReveal>

      <HomeSectionReveal variant="scaleIn">
        <ServicesSection />
      </HomeSectionReveal>

      <HomeSectionReveal variant="slideInLeft">
        <AboutSection />
      </HomeSectionReveal>

      <HomeSectionReveal variant="fadeUp">
        <TestimonialsSection />
      </HomeSectionReveal>

      <HomeSectionReveal variant="fadeUp">
        <Footer />
      </HomeSectionReveal>
    </div>
  );
}
