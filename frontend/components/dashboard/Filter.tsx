"use client";

import { DASHBOARD_CITIES } from "@/lib/dashboardCities";
import { computeSliderMaxFromServices } from "@/lib/dashboardPriceRange";
import type { Service } from "@/lib/api";
import { fadeUp, slideInLeft, staggerContainer } from "@/lib/motion/presets";
import { AnimatePresence, motion } from "framer-motion";
import { Dispatch, ReactNode, SetStateAction, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";
import { HiCheck } from "react-icons/hi2";
import StarIcon from "../icons/StarIcon";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import {
  RATING_FILTER_OPTIONS,
  type DashboardFilters,
  type MinRatingFilter,
} from "./dashboardFilters";

export {
  RATING_FILTER_OPTIONS,
  SORT_OPTIONS,
  type DashboardFilters,
  type DashboardSort,
  type MinRatingFilter,
} from "./dashboardFilters";

interface FilterProps {
  setFilters: Dispatch<SetStateAction<DashboardFilters>>;
  services: Service[];
  maxPrice: number;
  priceFrom: number;
  priceTo: number;
  city: string;
  cityOptions?: string[];
  minRatings: MinRatingFilter[];
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </h3>
  );
}

export default function Filter({
  setFilters,
  services,
  maxPrice,
  priceFrom,
  priceTo,
  city: selectedCity,
  cityOptions,
  minRatings,
}: FilterProps) {
  const { t } = useTranslation("common", { i18n });

  const sliderCap = maxPrice > 0 ? maxPrice : 2000;
  const value = useMemo(
    () => [
      Math.min(Math.max(0, priceFrom), sliderCap),
      Math.min(Math.max(priceFrom, priceTo), sliderCap),
    ],
    [priceFrom, priceTo, sliderCap],
  );

  const setRange = (from: number, to: number) => {
    const hi = Math.min(sliderCap, Math.max(from, to));
    const lo = Math.min(Math.max(0, from), hi);
    setFilters((prev) => ({
      ...prev,
      priceFrom: lo,
      priceTo: hi,
    }));
  };

  const citySelectOptions = useMemo(() => {
    const fromData = (cityOptions ?? []).map((c) => c.trim()).filter(Boolean);
    const set = new Set<string>(fromData);
    if (set.size === 0) {
      for (const c of DASHBOARD_CITIES) set.add(c);
    }
    const sel = selectedCity.trim();
    if (sel) set.add(sel);
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [cityOptions, selectedCity]);

  const toggleRating = (rating: MinRatingFilter) => {
    setFilters((prev) => {
      const has = prev.minRatings.includes(rating);
      const next = has
        ? prev.minRatings.filter((r) => r !== rating)
        : [...prev.minRatings, rating];
      return {
        ...prev,
        minRatings: next.sort((a, b) => b - a),
      };
    });
  };

  const selectedSet = useMemo(() => new Set(minRatings), [minRatings]);

  return (
    <motion.aside
      className="w-full max-w-none flex flex-col gap-5 px-2 sm:px-0 pb-5 lg:max-w-64 lg:mx-0 mx-auto lg:pb-0 border-b lg:border-b-0 border-gray-200"
      variants={slideInLeft}
      initial="hidden"
      animate="show"
      aria-label={t("dashboard.filtersPanel")}
    >
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5">
        <motion.div variants={fadeUp}>
          <SectionTitle>{t("dashboard.city")}</SectionTitle>
          <select
            id="dashboard-city-filter"
            value={selectedCity}
            onChange={(e) => {
              const nextCity = e.target.value;
              setFilters((prev) => {
                const cap = computeSliderMaxFromServices(services, {
                  category: prev.category,
                  city: nextCity,
                });
                return {
                  ...prev,
                  city: nextCity,
                  priceFrom: 0,
                  priceTo: cap,
                };
              });
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#486284] focus:ring-2 focus:ring-[#486284]/20"
          >
            <option value="">{t("dashboard.allCities")}</option>
            {citySelectOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </motion.div>

        <motion.div variants={fadeUp}>
          <SectionTitle>{t("dashboard.priceRange")}</SectionTitle>
          <Slider
            range
            min={0}
            max={sliderCap}
            handleStyle={{ borderColor: "#486284" }}
            styles={{
              track: { backgroundColor: "#486284", borderColor: "#486284" },
            }}
            value={value}
            onChange={(v) => {
              if (Array.isArray(v)) setRange(v[0], v[1]);
            }}
          />
          <div className="mt-3 flex justify-between items-center gap-2">
            <label
              htmlFor="fromFilter"
              className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-600 focus-within:border-[#486284] focus-within:ring-2 focus-within:ring-[#486284]/20"
            >
              <input
                className="w-full min-w-0 bg-transparent outline-none"
                type="number"
                id="fromFilter"
                min={0}
                max={value[1]}
                value={value[0]}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n)) return;
                  setRange(Math.max(0, Math.min(n, value[1])), value[1]);
                }}
              />
              <span className="shrink-0 text-[10px] font-semibold text-gray-400">₸</span>
            </label>
            <span className="text-gray-300">—</span>
            <label
              htmlFor="toFilter"
              className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-600 focus-within:border-[#486284] focus-within:ring-2 focus-within:ring-[#486284]/20"
            >
              <input
                className="w-full min-w-0 bg-transparent outline-none"
                type="number"
                id="toFilter"
                min={value[0]}
                max={sliderCap}
                value={value[1]}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n)) return;
                  setRange(value[0], Math.min(sliderCap, Math.max(value[0], n)));
                }}
              />
              <span className="shrink-0 text-[10px] font-semibold text-gray-400">₸</span>
            </label>
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <SectionTitle>{t("dashboard.sellerRating")}</SectionTitle>
          <div
            className="flex flex-col gap-1"
            role="group"
            aria-label={t("dashboard.sellerRating")}
          >
            {RATING_FILTER_OPTIONS.map((rating) => (
              <RatingOption
                key={rating}
                rating={rating}
                active={selectedSet.has(rating)}
                onToggle={() => toggleRating(rating)}
                label={t("dashboard.ratingPlus", { rating })}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.aside>
  );
}

function RatingOption({
  rating,
  active,
  onToggle,
  label,
}: {
  rating: number;
  active: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={active}
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${
        active ? "bg-[#486284]/8" : "hover:bg-gray-50"
      }`}
    >
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors ${
          active
            ? "border-[#486284] bg-[#486284] text-white"
            : "border-gray-300 bg-white"
        }`}
        aria-hidden
      >
        <AnimatePresence mode="popLayout">
          {active ? (
            <motion.span
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <HiCheck className="h-3 w-3 stroke-3" />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </span>

      <span className="flex shrink-0 items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon
            key={i}
            fillPercent={Math.round(Math.min(1, Math.max(0, rating - i)) * 100)}
          />
        ))}
      </span>

      <span className={`text-sm ${active ? "font-medium text-[#486284]" : "text-gray-600"}`}>
        {label}
      </span>
    </motion.button>
  );
}
