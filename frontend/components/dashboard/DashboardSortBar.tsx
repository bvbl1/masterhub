"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion/presets";
import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";
import { HiOutlineStar } from "react-icons/hi2";
import {
  HiOutlineSortAscending,
  HiOutlineSortDescending,
} from "react-icons/hi";
import {
  SORT_OPTIONS,
  type DashboardFilters,
  type DashboardSort,
} from "./dashboardFilters";

type DashboardSortBarProps = {
  sort: DashboardSort | null;
  setFilters: Dispatch<SetStateAction<DashboardFilters>>;
};

const SORT_META: Record<
  DashboardSort,
  { icon: (active: boolean) => ReactNode }
> = {
  rating: {
    icon: (active) => (
      <HiOutlineStar
        className={`h-4 w-4 shrink-0 ${active ? "text-[#486284]" : "text-slate-400"}`}
        aria-hidden
      />
    ),
  },
  price_asc: {
    icon: (active) => (
      <HiOutlineSortAscending
        className={`h-4 w-4 shrink-0 ${active ? "text-[#486284]" : "text-slate-400"}`}
        aria-hidden
      />
    ),
  },
  price_desc: {
    icon: (active) => (
      <HiOutlineSortDescending
        className={`h-4 w-4 shrink-0 ${active ? "text-[#486284]" : "text-slate-400"}`}
        aria-hidden
      />
    ),
  },
};

export default function DashboardSortBar({
  sort,
  setFilters,
}: DashboardSortBarProps) {
  const { t } = useTranslation("common", { i18n });

  const label = (key: DashboardSort) => {
    switch (key) {
      case "rating":
        return t("dashboard.sortByRating");
      case "price_asc":
        return t("dashboard.sortCheapest");
      case "price_desc":
        return t("dashboard.sortMostExpensive");
    }
  };

  const toggle = (key: DashboardSort) => {
    setFilters((prev) => ({
      ...prev,
      sort: prev.sort === key ? null : key,
    }));
  };

  return (
    <motion.div
      className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
      variants={fadeUp}
      initial="hidden"
      animate="show"
    >
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {t("dashboard.sortTitle")}
      </span>
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label={t("dashboard.sortTitle")}
      >
        {SORT_OPTIONS.map((key) => {
          const active = sort === key;
          return (
            <motion.button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(key)}
              whileTap={{ scale: 0.97 }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-[#486284]/30 bg-[#486284]/10 text-[#486284]"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[#486284]/25 hover:bg-gray-50"
              }`}
            >
              {SORT_META[key].icon(active)}
              <span>{label(key)}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
