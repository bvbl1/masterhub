"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import StarIcon from "@/components/icons/StarIcon";
import {
  useServiceReviewStats,
  type ServiceReviewSummary,
} from "@/components/dashboard/useServiceReviewStats";
import {
  useHomeTranslation,
  HOME_SERVICE_TAB_IDS,
  type HomeServiceTabId,
} from "@/lib/i18n/useHomeTranslation";
import { categoriesApi, servicesApi, type Service } from "@/lib/api";
import { readServicePriceStart } from "@/lib/api/services";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  filterHomeServicesByTab,
  HOME_SERVICES_LIMIT,
} from "@/lib/home/categoryTabMatch";
import type { Category } from "@/lib/api";

const TAB_ROTATE_MS = 3500;
const TAB_PAUSE_AFTER_CLICK_MS = 12000;

const HOME_GRID_CLASS =
  "grid gap-5 sm:gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18.5rem),1fr))]";

export default function ServicesSection() {
  const { t, serviceTabLabel } = useHomeTranslation();
  const [activeTab, setActiveTab] = useState<HomeServiceTabId>("construction");
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const tabButtonRefs = useRef<
    Partial<Record<HomeServiceTabId, HTMLButtonElement>>
  >({});
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      servicesApi.getServices().catch(() => ({ services: [] as Service[] })),
      categoriesApi
        .getCategories()
        .catch(() => ({ categories: [] as Category[] })),
    ])
      .then(([svcRes, catRes]) => {
        if (cancelled) return;
        setServices(svcRes.services);
        setCategories(catRes.categories);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleServices = useMemo(
    () => filterHomeServicesByTab(services, activeTab, categories),
    [services, activeTab, categories],
  );

  const reviewStats = useServiceReviewStats(visibleServices, loading);

  const selectTab = useCallback((tabId: HomeServiceTabId, fromUser = false) => {
    setActiveTab(tabId);
    if (fromUser) {
      setAutoRotate(false);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => {
        setAutoRotate(true);
        pauseTimerRef.current = null;
      }, TAB_PAUSE_AFTER_CLICK_MS);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!autoRotate || loading) return;

    const id = window.setInterval(() => {
      setActiveTab((prev) => {
        const idx = HOME_SERVICE_TAB_IDS.indexOf(prev);
        const next =
          HOME_SERVICE_TAB_IDS[(idx + 1) % HOME_SERVICE_TAB_IDS.length];
        return next;
      });
    }, TAB_ROTATE_MS);

    return () => window.clearInterval(id);
  }, [autoRotate, loading]);

  return (
    <section
      id="services"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20 scroll-mt-16 lg:scroll-mt-24"
    >
      <div className="text-center mb-8 sm:mb-10 lg:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-[48px] font-medium text-[#456186] mb-3 sm:mb-4 leading-tight">
          {t("services.title")}
        </h2>
        <p className="max-w-[530px] text-sm sm:text-base lg:text-lg font-normal mx-auto text-[#1A202C]/70 leading-relaxed px-1">
          {t("services.subtitle")}
        </p>
      </div>

      <div className="-mx-4 sm:mx-0 mb-8 sm:mb-10">
        <div
          className="relative flex gap-2 px-4 sm:px-0 pb-2 overflow-x-auto scrollbar-none snap-x snap-mandatory sm:flex-wrap sm:justify-center sm:overflow-visible sm:snap-none border-b border-[#E2E8F0]"
          role="tablist"
        >
          {HOME_SERVICE_TAB_IDS.map((tabId) => {
            const active = activeTab === tabId;
            return (
              <button
                key={tabId}
                ref={(el) => {
                  tabButtonRefs.current[tabId] = el ?? undefined;
                }}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(tabId, true)}
                className={`
                  relative snap-center shrink-0 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full sm:rounded-none text-sm sm:text-base lg:text-[22px] font-medium transition-colors whitespace-nowrap min-h-[44px]
                  ${
                    active
                      ? "bg-[#456186] text-white sm:bg-transparent sm:text-[#1A202C] sm:font-semibold"
                      : "bg-[#E2E8F0]/80 text-[#1A202C]/60 sm:bg-transparent hover:text-[#1A202C]"
                  }
                `}
              >
                {active ? (
                  <motion.span
                    layoutId="home-services-tab-indicator"
                    className="hidden sm:block absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#1A202C]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    aria-hidden
                  />
                ) : null}
                {serviceTabLabel(tabId)}
              </button>
            );
          })}
        </div>
      </div>

      {loadError ? (
        <p className="text-center text-sm text-red-600 mb-8">
          {t("services.loadError")}
        </p>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={loading ? "loading" : activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={`${HOME_GRID_CLASS} mb-8 sm:mb-10 lg:mb-12`}
        >
          {loading ? (
            Array.from({ length: HOME_SERVICES_LIMIT }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))
          ) : visibleServices.length === 0 ? (
            <p className="col-span-full text-center text-sm text-[#1A202C]/60 py-10">
              {t("services.empty")}
            </p>
          ) : (
            visibleServices.map((service) => (
              <HomeServiceCard
                key={service.id}
                service={service}
                reviewSummary={reviewStats[service.id]}
              />
            ))
          )}
        </motion.div>
      </AnimatePresence>

      <div className="text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center text-sm font-semibold text-[#456186] underline-offset-2 hover:underline min-h-[44px] px-4"
        >
          {t("services.showMore")}
        </Link>
      </div>
    </section>
  );
}

function serviceCoverUrl(service: Service): string | undefined {
  const url = service.photoUrls?.[0];
  return typeof url === "string" && url.trim() ? url.trim() : undefined;
}

function ServiceCardSkeleton() {
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md animate-pulse">
      <div className="aspect-5/3 w-full bg-gray-200" />
      <div className="space-y-3 p-4">
        <div className="h-5 bg-gray-200 rounded w-4/5" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-8 bg-gray-100 rounded w-2/5 mt-2" />
      </div>
    </div>
  );
}

function HomeServiceCard({
  service,
  reviewSummary,
}: {
  service: Service;
  reviewSummary?: ServiceReviewSummary;
}) {
  const { t } = useHomeTranslation();
  const cover = serviceCoverUrl(service);
  const price = readServicePriceStart(service);

  return (
    <article className="flex min-w-0 w-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md shadow-gray-200/60 transition-shadow hover:shadow-lg">
      <Link
        href={`/dashboard/${service.id}`}
        className="relative block w-full aspect-5/3 shrink-0 bg-gray-100"
      >
        {cover ? (
          <Image
            src={cover}
            alt={service.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 320px"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
            <svg
              className="h-14 w-14 opacity-60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
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
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link href={`/dashboard/${service.id}`}>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2 hover:text-[#456186] transition-colors">
            {service.title}
          </h3>
        </Link>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <StarIcon />
          {reviewSummary != null && reviewSummary.count > 0 ? (
            <>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {reviewSummary.avgRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                ({reviewSummary.count}{" "}
                {reviewSummary.count === 1
                  ? t("services.review")
                  : t("services.reviews")}
                )
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-500">
              {t("services.noReviewsYet")}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 uppercase tracking-wide">
              {t("services.startingAt")}
            </span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {formatCurrency(price)}
            </span>
          </div>
          <Link
            href={`/dashboard/${service.id}`}
            className="w-full sm:w-auto shrink-0"
          >
            <span className="flex min-h-[44px] w-full sm:w-auto items-center justify-center rounded-lg bg-[#456186] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3d526d]">
              {t("services.viewDetails")}
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
