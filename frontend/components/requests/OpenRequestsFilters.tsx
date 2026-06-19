"use client";

import type { Category } from "@/lib/api";
import { useRequestsTranslation } from "@/lib/i18n/useRequestsTranslation";

export type AppliedFilters = {
  categoryId: string;
  city: string;
  keyword: string;
};

type OpenRequestsFiltersProps = {
  categories: Category[];
  cities: string[];
  draftCategoryId: string;
  draftCity: string;
  draftKeyword: string;
  applied: AppliedFilters;
  onDraftCategoryChange: (v: string) => void;
  onDraftCityChange: (v: string) => void;
  onDraftKeywordChange: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
  onRemoveChip: (key: "category" | "city" | "keyword") => void;
  resultCount?: number;
};

export default function OpenRequestsFilters({
  categories,
  cities,
  draftCategoryId,
  draftCity,
  draftKeyword,
  applied,
  onDraftCategoryChange,
  onDraftCityChange,
  onDraftKeywordChange,
  onApply,
  onClear,
  onRemoveChip,
  resultCount,
}: OpenRequestsFiltersProps) {
  const { t, openRequestCountLabel } = useRequestsTranslation();
  const categoryName =
    categories.find((c) => c.id === applied.categoryId)?.name ??
    applied.categoryId;

  const hasApplied = Boolean(
    applied.categoryId || applied.city || applied.keyword.trim(),
  );
  const hasChips = hasApplied;

  return (
    <div className="mb-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-2 sm:p-3 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 flex-1">
            <div className="min-w-[160px] flex-1 sm:max-w-[220px]">
              <label
                htmlFor="filter-category"
                className="block text-xs font-semibold text-slate-500 mb-1.5"
              >
                {t("filters.category")}
              </label>
              <select
                id="filter-category"
                value={draftCategoryId}
                onChange={(e) => onDraftCategoryChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-[#486284] focus:ring-2 focus:ring-[#486284]/20"
              >
                <option value="">{t("filters.allCategories")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[160px] flex-1 sm:max-w-[220px]">
              <label
                htmlFor="filter-city"
                className="block text-xs font-semibold text-slate-500 mb-1.5"
              >
                {t("filters.city")}
              </label>
              <select
                id="filter-city"
                value={draftCity}
                onChange={(e) => onDraftCityChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-[#486284] focus:ring-2 focus:ring-[#486284]/20"
              >
                <option value="">{t("filters.allCities")}</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[180px] flex-1 sm:max-w-[280px]">
              <label
                htmlFor="filter-keyword"
                className="block text-xs font-semibold text-slate-500 mb-1.5"
              >
                {t("filters.keywords")}
              </label>
              <input
                id="filter-keyword"
                type="search"
                value={draftKeyword}
                onChange={(e) => onDraftKeywordChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onApply();
                  }
                }}
                placeholder={t("filters.keywordPlaceholder")}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-[#486284] focus:ring-2 focus:ring-[#486284]/20"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onApply}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#486284] rounded-xl hover:bg-[#3a5270] transition-colors shadow-sm"
            >
              {t("filters.apply")}
            </button>
            <button
              type="button"
              onClick={onClear}
              className="text-sm font-medium text-slate-500 hover:text-[#486284] transition-colors"
            >
              {t("filters.clear")}
            </button>
          </div>
        </div>
      </div>

      {hasChips || resultCount !== undefined ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {applied.categoryId ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {t("filters.chipCategory", { name: categoryName })}
              <button
                type="button"
                onClick={() => onRemoveChip("category")}
                className="text-slate-400 hover:text-slate-700"
                aria-label={t("filters.removeCategory")}
              >
                ×
              </button>
            </span>
          ) : null}
          {applied.city ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {t("filters.chipCity", { name: applied.city })}
              <button
                type="button"
                onClick={() => onRemoveChip("city")}
                className="text-slate-400 hover:text-slate-700"
                aria-label={t("filters.removeCity")}
              >
                ×
              </button>
            </span>
          ) : null}
          {applied.keyword.trim() ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {t("filters.chipKeywords", { text: applied.keyword.trim() })}
              <button
                type="button"
                onClick={() => onRemoveChip("keyword")}
                className="text-slate-400 hover:text-slate-700"
                aria-label={t("filters.removeKeyword")}
              >
                ×
              </button>
            </span>
          ) : null}
          {resultCount !== undefined ? (
            <span className="text-xs text-slate-500 ml-auto sm:ml-0">
              {openRequestCountLabel(resultCount)}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
