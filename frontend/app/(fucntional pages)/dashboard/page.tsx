"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";
import Categories from "@/components/dashboard/Categories";
import Filter from "@/components/dashboard/Filter";
import {
  createDefaultDashboardFilters,
  type DashboardFilters,
} from "@/components/dashboard/dashboardFilters";
import Services from "@/components/dashboard/Services";
import { sortDashboardServices } from "@/lib/dashboardSort";
import { useServiceReviewStats } from "@/components/dashboard/useServiceReviewStats";
import {
  authApi,
  categoriesApi,
  servicesApi,
  type Category,
  type Service,
  type ServiceProviderSummary,
} from "@/lib/api";
import { computeSliderMaxFromServices } from "@/lib/dashboardPriceRange";
import { readServicePriceStart } from "@/lib/api/services";

export default function DashboardPage() {
  const { t } = useTranslation("common", { i18n });
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>(
    createDefaultDashboardFilters(),
  );

  useEffect(() => {
    categoriesApi
      .getCategories()
      .then((cat) => setCategories(cat.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setLoadFailed(false);
    const apiFilters =
      filters.category !== ""
        ? { category_id: Number(filters.category) }
        : undefined;
    servicesApi
      .getServices(apiFilters)
      .then(async (ser) => {
        const base = ser.services;
        const uniqueIds = [...new Set(base.map((s) => s.providerId))];
        const summaryById = new Map<string, ServiceProviderSummary>();
        await Promise.all(
          uniqueIds.map(async (pid) => {
            try {
              const { user } = await authApi.getProviderInfo(String(pid));
              summaryById.set(String(pid), {
                firstName: user.firstName,
                secondName: user.secondName,
                avatarUrl: user.avatarUrl,
              });
            } catch {
              /* гость или недоступен профиль */
            }
          }),
        );
        const enriched = base.map((s) => ({
          ...s,
          provider: summaryById.get(String(s.providerId)),
        }));
        setServices(enriched);
        setFilters((prev) => {
          const cap = computeSliderMaxFromServices(enriched, {
            category: prev.category,
            city: prev.city,
          });
          return {
            ...prev,
            priceFrom: 0,
            priceTo: cap,
          };
        });
      })
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false));
  }, [filters.category]);

  const reviewStats = useServiceReviewStats(services, loading);

  const filteredData = useMemo(() => {
    const filtered = services.filter((ser) => {
      const byCategory =
        !filters.category || ser.categoryId === filters.category;

      const price = readServicePriceStart(ser);
      const byPrice = price >= filters.priceFrom && price <= filters.priceTo;

      const wantCity = filters.city.trim();
      const byCity =
        !wantCity || ser.city?.trim().toLowerCase() === wantCity.toLowerCase();

      const byRating =
        filters.minRatings.length === 0 ||
        (() => {
          const stats = reviewStats[ser.id];
          if (!stats || stats.count === 0) return false;
          return filters.minRatings.some((r) => stats.avgRating >= r);
        })();

      return byCategory && byPrice && byCity && byRating;
    });
    return sortDashboardServices(filtered, filters.sort, reviewStats);
  }, [services, filters, reviewStats]);

  const handleClearAllFilters = () => {
    const cap = computeSliderMaxFromServices(services, {
      category: "",
      city: "",
    });
    setFilters(createDefaultDashboardFilters(cap));
  };

  const maxPrice = useMemo(
    () =>
      computeSliderMaxFromServices(services, {
        category: filters.category,
        city: filters.city,
      }),
    [services, filters.category, filters.city],
  );

  const filterCityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of services) {
      const c = s.city?.trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [services]);

  return (
    <div className="min-w-0 w-screen flex flex-col items-center">
      <Categories
        categories={categories}
        activeCategoryId={filters.category}
        setFilters={setFilters}
      />
      {loadFailed ? (
        <div className="px-4 py-3 text-red-600 text-center text-sm sm:text-base">
          {t("dashboard.loadError")}
        </div>
      ) : null}
      <div className=" w-full flex flex-col items-center justify-center gap-8 max-w-370 lg:flex-row lg:gap-10 p-4 sm:p-5 pb-8 lg:items-start lg:pb-10">
        <aside className="w-full shrink-0 lg:w-auto lg:min-w-56 lg:max-w-64 lg:sticky lg:top-20 lg:top-4">
          <Filter
            setFilters={setFilters}
            services={services}
            maxPrice={maxPrice}
            priceFrom={filters.priceFrom}
            priceTo={filters.priceTo}
            city={filters.city}
            cityOptions={filterCityOptions}
            minRatings={filters.minRatings}
          />
        </aside>
        <div className="min-w-0 flex-1">
          <Services
            services={filteredData}
            allServices={services}
            categories={categories}
            loading={loading}
            reviewStats={reviewStats}
            filters={filters}
            maxPrice={maxPrice}
            sort={filters.sort}
            setFilters={setFilters}
            onClearAllFilters={handleClearAllFilters}
          />
        </div>
      </div>
    </div>
  );
}
