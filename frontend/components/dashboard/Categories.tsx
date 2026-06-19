"use client";

import type { Category } from "@/lib/api";
import { CategoryIconDisplay } from "@/lib/categoryIcons";
import { fadeUp, staggerContainer } from "@/lib/motion/presets";
import { motion } from "framer-motion";
import { type ReactNode, Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";
import type { DashboardFilters } from "./dashboardFilters";

interface CategoriesProps {
  categories: Category[];
  activeCategoryId: string;
  setFilters: Dispatch<SetStateAction<DashboardFilters>>;
}

type TabProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  label: string;
};

function CategoryTab({ active, onClick, children, label }: TabProps) {
  return (
    <motion.button
      type="button"
      variants={fadeUp}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      aria-pressed={active}
      aria-label={label}
      className={`group relative h-full shrink-0 snap-start flex flex-col items-center gap-1.5 min-w-[4.25rem] max-w-[5.5rem] px-2 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#486284]/40 focus-visible:ring-offset-1 ${
        active
          ? "bg-black/2"
          : "border-transparent bg-transparent hover:bg-white/80 hover:border-slate-200/80"
      }`}
    >
      {active ? (
        <motion.span
          layoutId="category-tab-indicator"
          className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#486284]"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          aria-hidden
        />
      ) : null}
      {children}
    </motion.button>
  );
}

export default function Categories({
  categories,
  activeCategoryId,
  setFilters,
}: CategoriesProps) {
  const { t } = useTranslation("common", { i18n });
  const allActive = activeCategoryId === "";
  const allLabel = t("dashboard.allCategories");

  return (
    <motion.nav
      aria-label={allLabel}
      className="w-full border-b border-slate-200/90 bg-slate-50/50"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="scrollbar flex items-start gap-1.5 overflow-x-auto px-3 py-2.5 sm:px-4 snap-x snap-mandatory scroll-px-3"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <CategoryTab
          active={allActive}
          onClick={() => setFilters((prev) => ({ ...prev, category: "" }))}
          label={allLabel}
        >
          <motion.span
            layout
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
              allActive
                ? "bg-[#486284] text-white"
                : "bg-slate-100 text-[#486284] group-hover:bg-slate-200/80"
            }`}
            transition={{ duration: 0.2 }}
          >
            ∞
          </motion.span>
          <span
            className={`text-[11px] sm:text-xs font-medium text-center leading-tight line-clamp-2 w-full ${
              allActive ? "text-[#486284] font-semibold" : "text-slate-600"
            }`}
          >
            {allLabel}
          </span>
        </CategoryTab>

        {categories.map((cat) => {
          const active = cat.id === activeCategoryId;
          return (
            <CategoryTab
              key={cat.id}
              active={active}
              onClick={() =>
                setFilters((prev) => ({ ...prev, category: String(cat.id) }))
              }
              label={cat.name}
            >
              <motion.span
                layout
                className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg ${
                  active
                    ? "ring-2 ring-[#486284]/25 bg-slate-50"
                    : "ring-1 ring-slate-200/90 bg-white group-hover:ring-slate-300"
                }`}
                transition={{ duration: 0.2 }}
              >
                <CategoryIconDisplay
                  icon={cat.icon}
                  className="h-7 w-7 text-[#486284]"
                  imgSize={28}
                />
              </motion.span>
              <span
                className={`text-[11px] sm:text-xs text-center leading-tight line-clamp-2 w-full ${
                  active
                    ? "text-[#486284] font-semibold"
                    : "text-slate-600 font-medium"
                }`}
              >
                {cat.name}
              </span>
            </CategoryTab>
          );
        })}
      </motion.div>
    </motion.nav>
  );
}
