"use client";

import Image from "next/image";
import Link from "next/link";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import StarIcon from "../icons/StarIcon";
import Search from "../common/Search";
import type { Category, Service } from "@/lib/api";
import type { ServiceReviewSummary } from "./useServiceReviewStats";
import { formatCurrency } from "@/lib/formatCurrency";
import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";
import DashboardSortBar from "./DashboardSortBar";
import type { DashboardFilters, DashboardSort } from "./dashboardFilters";
import ActiveFiltersBar from "./ActiveFiltersBar";

/** 1 col mobile → auto-fill by min card width (fills sidebar + main layouts). */
const SERVICES_GRID_CLASS =
  "mt-2 sm:mt-6 grid gap-2 sm:gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,20rem),1fr))]";

interface ServicesProps {
  services: Service[];
  allServices: Service[];
  categories: Category[];
  loading: boolean;
  reviewStats?: Record<string, ServiceReviewSummary>;
  filters: DashboardFilters;
  maxPrice: number;
  sort: DashboardSort | null;
  setFilters: Dispatch<SetStateAction<DashboardFilters>>;
  onClearAllFilters: () => void;
}

export default function Services({
  services,
  allServices,
  categories,
  loading,
  reviewStats: reviewStatsProp,
  filters,
  maxPrice,
  sort,
  setFilters,
  onClearAllFilters,
}: ServicesProps) {
  const { t } = useTranslation("common", { i18n });
  const [searchQuery, setSearchQuery] = useState("");
  const reviewStats = reviewStatsProp ?? {};

  const searchSortAndFilters = (
    <>
      <Search
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={t("dashboard.searchPlaceholder")}
      />
      <DashboardSortBar sort={sort} setFilters={setFilters} />
      <ActiveFiltersBar
        filters={filters}
        maxPrice={maxPrice}
        categories={categories}
        setFilters={setFilters}
        services={allServices}
        onClearAll={onClearAllFilters}
      />
    </>
  );

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return services;
    return services.filter((service) =>
      serviceMatchesSearch(service, categories, q),
    );
  }, [services, categories, searchQuery]);

  if (loading) {
    return (
      <div className="w-full">
        {searchSortAndFilters}
        <div className={SERVICES_GRID_CLASS}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-full bg-white border border-gray-100 overflow-hidden rounded-2xl shadow-md animate-pulse"
            >
              <div className="w-full h-48 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-2 bg-gray-200 rounded w-1/4 ml-auto" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="w-full">
        {searchSortAndFilters}
        <div className="mt-20 text-center text-gray-500">
          <p className="text-lg">{t("dashboard.noServices")}</p>
          <p className="text-sm mt-1">{t("dashboard.tryCategory")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {searchSortAndFilters}
      {filteredServices.length === 0 ? (
        <div className="mt-20 text-center text-gray-500">
          <p className="text-lg">{t("dashboard.noSearchMatch")}</p>
          <p className="text-sm mt-1">{t("dashboard.tryKeyword")}</p>
        </div>
      ) : (
        <div className={SERVICES_GRID_CLASS}>
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              categoryLabel={categoryLabel(categories, service.categoryId)}
              reviewSummary={reviewStats[service.id]}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function categoryLabel(categories: Category[], categoryId: string): string {
  const c = categories.find((x) => x.id === categoryId);
  return c?.name ?? "";
}

function serviceMatchesSearch(
  service: Service,
  categories: Category[],
  q: string,
): boolean {
  if (!q) return true;
  const inText = (s: string) => s.toLowerCase().includes(q);
  if (inText(service.title)) return true;
  if (inText(service.description)) return true;
  if (inText(categoryLabel(categories, service.categoryId))) return true;
  if (inText(providerSearchName(service))) return true;
  if (service.city && inText(service.city)) return true;
  if (inText(String(service.priceStart))) return true;
  if (inText(service.providerId)) return true;
  return false;
}

function providerSearchName(service: Service): string {
  const p = service.provider;
  if (p) {
    const name = `${p.firstName} ${p.secondName}`.trim();
    if (name) return name;
  }
  return `Provider #${service.providerId}`;
}

function providerDisplayName(
  service: Service,
  t: (key: string, opts?: { id: string }) => string,
): string {
  const p = service.provider;
  if (p) {
    const name = `${p.firstName} ${p.secondName}`.trim();
    if (name) return name;
  }
  return t("dashboard.providerFallback", { id: String(service.providerId) });
}

function providerInitials(service: Service): string {
  const p = service.provider;
  if (p) {
    const a = p.firstName?.trim().charAt(0) ?? "";
    const b = p.secondName?.trim().charAt(0) ?? "";
    const s = `${a}${b}`.toUpperCase();
    if (s) return s;
  }
  return "P";
}

function serviceCityLabel(service: Service): string | undefined {
  const raw = service as Service & { city?: string };
  const c = service.city ?? raw.city;
  return typeof c === "string" && c.trim() ? c.trim() : undefined;
}

function ServiceCard({
  service,
  categoryLabel: catLabel,
  reviewSummary,
  t,
}: {
  service: Service;
  categoryLabel: string;
  reviewSummary?: ServiceReviewSummary;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const firstPhoto = service.photoUrls?.[0];
  const p = service.provider;
  const name = providerDisplayName(service, t);
  const initials = providerInitials(service);
  const cityLabel = serviceCityLabel(service);

  return (
    <article className="flex w-full min-w-0 flex-col bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/60 overflow-hidden">
      {firstPhoto ? (
        <div className="relative w-full aspect-[5/3] bg-gray-100 shrink-0">
          <Image
            src={firstPhoto}
            alt={service.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px)"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-full aspect-[5/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 shrink-0">
          <svg
            className="w-14 h-14 opacity-60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      <div className="px-4 pt-3 pb-1 flex items-center gap-3 min-w-0">
        <Link
          href={`/provider/${service.providerId}`}
          className="flex items-center gap-3 min-w-0 flex-1 group rounded-lg -mx-1 px-1 py-0.5 hover:bg-slate-50/80 transition-colors"
        >
          <div className="relative w-9 h-9 shrink-0 rounded-full ring-2 ring-white shadow-sm overflow-hidden bg-[#486284] flex items-center justify-center text-white text-xs font-bold">
            {p?.avatarUrl ? (
              <Image
                src={p.avatarUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              initials
            )}
          </div>
          <span className="text-sm font-medium text-slate-900 truncate group-hover:text-[#486284] transition-colors">
            {name}
          </span>
        </Link>
        {catLabel ? (
          <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-400 shrink-0 pl-1 max-w-[38%] truncate text-right">
            {catLabel}
          </span>
        ) : null}
      </div>

      <div className="px-4 pb-4 pt-2 flex flex-col flex-1">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2">
          {service.title}
        </h2>
        {cityLabel ? (
          <p className="text-sm text-gray-600 mt-2 flex items-center gap-1.5 min-h-5">
            <svg
              className="w-4 h-4 shrink-0 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="line-clamp-1">{cityLabel}</span>
          </p>
        ) : null}
        {/* <p className="text-gray-500 mt-1.5 text-sm leading-relaxed line-clamp-2">
          {service.description}
        </p> */}

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <StarIcon />
          {reviewSummary != null && reviewSummary.count > 0 ? (
            <>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {reviewSummary.avgRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                ({reviewSummary.count}{" "}
                {reviewSummary.count === 1
                  ? t("dashboard.review")
                  : t("dashboard.reviews")}
                )
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-500">
              {t("dashboard.noReviewsYet")}
            </span>
          )}
        </div>

        <div className="mt-auto pt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 uppercase tracking-wide">
              {t("dashboard.startingAt")}
            </span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {formatCurrency(service.priceStart)}
            </span>
          </div>
          <Link
            href={`/dashboard/${service.id}`}
            className="w-full sm:w-auto shrink-0"
          >
            <button
              type="button"
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-[#4a6282] hover:bg-[#3d526d] rounded-lg text-white font-semibold text-sm transition-colors"
            >
              {t("dashboard.viewDetails")}
            </button>
          </Link>
        </div>
      </div>
    </article>
  );
}
