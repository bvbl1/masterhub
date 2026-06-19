"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { fadeUp } from "@/lib/motion/presets";
import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";
import { HiOutlineMapPin, HiOutlineStar } from "react-icons/hi2";
import {
  HiOutlineSortAscending,
  HiOutlineSortDescending,
  HiOutlineX,
} from "react-icons/hi";
import { FiTool } from "react-icons/fi";
import { CategoryIconDisplay } from "@/lib/categoryIcons";
import type { Category, Service } from "@/lib/api";
import { formatCurrencyRange } from "@/lib/formatCurrency";
import { computeSliderMaxFromServices } from "@/lib/dashboardPriceRange";
import type { DashboardFilters, DashboardSort } from "./dashboardFilters";

export type ActiveFilterChip = {
  id: string;
  label: string;
  icon?: ReactNode;
  onRemove: () => void;
};

type ActiveFiltersBarProps = {
  filters: DashboardFilters;
  maxPrice: number;
  categories: Category[];
  setFilters: Dispatch<SetStateAction<DashboardFilters>>;
  services: Service[];
  onClearAll: () => void;
};

function SortIcon({ sort }: { sort: DashboardSort }) {
  if (sort === "rating") {
    return <HiOutlineStar className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  }
  if (sort === "price_asc") {
    return (
      <HiOutlineSortAscending className="h-3.5 w-3.5 shrink-0" aria-hidden />
    );
  }
  return (
    <HiOutlineSortDescending className="h-3.5 w-3.5 shrink-0" aria-hidden />
  );
}

function FilterChip({
  label,
  icon,
  onRemove,
}: {
  label: string;
  icon?: ReactNode;
  onRemove: () => void;
}) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.2 }}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#486284]/25 bg-[#486284]/8 py-1 pl-2.5 pr-1 text-sm font-medium text-[#486284]"
    >
      {icon ? (
        <span className="flex shrink-0 items-center text-[#486284]/80">
          {icon}
        </span>
      ) : null}
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#486284]/70 transition hover:bg-[#486284]/15 hover:text-[#486284]"
        aria-label={`Remove ${label}`}
      >
        <HiOutlineX className="h-3.5 w-3.5" aria-hidden />
      </button>
    </motion.span>
  );
}

export function buildActiveFilterChips({
  filters,
  maxPrice,
  categories,
  setFilters,
  services,
  t,
}: {
  filters: DashboardFilters;
  maxPrice: number;
  categories: Category[];
  setFilters: Dispatch<SetStateAction<DashboardFilters>>;
  services: Service[];
  t: (key: string, opts?: Record<string, unknown>) => string;
}): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  const cap = maxPrice > 0 ? maxPrice : 2000;
  const priceNarrowed = filters.priceFrom > 0 || filters.priceTo < cap;

  if (filters.category) {
    const cat = categories.find(
      (c) => String(c.id) === String(filters.category),
    );
    chips.push({
      id: "category",
      label: cat?.name ?? t("dashboard.filterCategory"),
      icon: cat?.icon ? (
        <CategoryIconDisplay
          icon={cat.icon}
          className="h-3.5 w-3.5 text-[#486284]"
          imgSize={14}
        />
      ) : (
        <FiTool className="h-3.5 w-3.5" aria-hidden />
      ),
      onRemove: () =>
        setFilters((prev) => ({
          ...prev,
          category: "",
        })),
    });
  }

  if (filters.city.trim()) {
    chips.push({
      id: "city",
      label: filters.city.trim(),
      icon: <HiOutlineMapPin className="h-3.5 w-3.5" aria-hidden />,
      onRemove: () => {
        setFilters((prev) => {
          const nextCap = computeSliderMaxFromServices(services, {
            category: prev.category,
            city: "",
          });
          return {
            ...prev,
            city: "",
            priceFrom: 0,
            priceTo: nextCap,
          };
        });
      },
    });
  }

  for (const rating of filters.minRatings) {
    chips.push({
      id: `rating-${rating}`,
      label: t("dashboard.ratingStarsPlus", { rating }),
      icon: <HiOutlineStar className="h-3.5 w-3.5" aria-hidden />,
      onRemove: () =>
        setFilters((prev) => ({
          ...prev,
          minRatings: prev.minRatings.filter((r) => r !== rating),
        })),
    });
  }

  if (priceNarrowed) {
    chips.push({
      id: "price",
      label: formatCurrencyRange(filters.priceFrom, filters.priceTo),
      onRemove: () =>
        setFilters((prev) => ({
          ...prev,
          priceFrom: 0,
          priceTo: cap,
        })),
    });
  }

  if (filters.sort) {
    const sortKey =
      filters.sort === "rating"
        ? "dashboard.sortByRating"
        : filters.sort === "price_asc"
          ? "dashboard.sortCheapest"
          : "dashboard.sortMostExpensive";
    chips.push({
      id: "sort",
      label: t(sortKey),
      icon: <SortIcon sort={filters.sort} />,
      onRemove: () =>
        setFilters((prev) => ({
          ...prev,
          sort: null,
        })),
    });
  }

  return chips;
}

export default function ActiveFiltersBar({
  filters,
  maxPrice,
  categories,
  setFilters,
  services,
  onClearAll,
}: ActiveFiltersBarProps) {
  const { t } = useTranslation("common", { i18n });

  const chips = useMemo(
    () =>
      buildActiveFilterChips({
        filters,
        maxPrice,
        categories,
        setFilters,
        services,
        t,
      }),
    [filters, maxPrice, categories, setFilters, services, t],
  );

  if (chips.length === 0) return null;

  return (
    <motion.div
      className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3"
      variants={fadeUp}
      initial="hidden"
      animate="show"
    >
      <span className="w-full shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:w-auto">
        {t("dashboard.activeFilters")}
      </span>
      <AnimatePresence mode="popLayout">
        {chips.map((chip) => (
          <FilterChip
            key={chip.id}
            label={chip.label}
            icon={chip.icon}
            onRemove={chip.onRemove}
          />
        ))}
      </AnimatePresence>
      <button
        type="button"
        onClick={onClearAll}
        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 transition hover:bg-gray-200/80"
      >
        <HiOutlineX className="h-3.5 w-3.5" aria-hidden />
        {t("dashboard.clearAllFilters")}
      </button>
    </motion.div>
  );
}
