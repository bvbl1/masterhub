"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import JobRequestCard from "@/components/requests/JobRequestCard";
import CustomerRequestsEmpty from "@/components/requests/CustomerRequestsEmpty";
import CustomerStatusTabs, {
  type CustomerRequestTab,
} from "@/components/requests/CustomerStatusTabs";
import OpenRequestsFilters, {
  type AppliedFilters,
} from "@/components/requests/OpenRequestsFilters";
import RequestsListSkeleton from "@/components/requests/RequestsListSkeleton";
import { useAuth } from "@/lib/context/AuthContext";
import {
  categoriesApi,
  servicesApi,
  jobRequestsApi,
  type Category,
  type JobRequest,
} from "@/lib/api";
import { useRequestsTranslation } from "@/lib/i18n/useRequestsTranslation";

const EMPTY_APPLIED: AppliedFilters = {
  categoryId: "",
  city: "",
  keyword: "",
};

function matchesKeyword(jr: JobRequest, keyword: string): boolean {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;
  const hay = `${jr.title} ${jr.description}`.toLowerCase();
  return hay.includes(q);
}

export default function RequestsPage() {
  const { t } = useRequestsTranslation();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [myRequests, setMyRequests] = useState<JobRequest[]>([]);
  const [openRequests, setOpenRequests] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customerTab, setCustomerTab] = useState<CustomerRequestTab>("all");

  const [draftCategoryId, setDraftCategoryId] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [draftKeyword, setDraftKeyword] = useState("");
  const [appliedFilters, setAppliedFilters] =
    useState<AppliedFilters>(EMPTY_APPLIED);

  const loadCustomer = useCallback(async () => {
    const list = await jobRequestsApi.listJobRequests({ limit: 200 });
    const uid = Number(user?.id);
    setMyRequests(list.filter((jr) => jr.customerId === uid));
  }, [user?.id]);

  const loadProvider = useCallback(
    async (filters: AppliedFilters) => {
      const list = await jobRequestsApi.listJobRequests({
        status: "open",
        category_id: filters.categoryId
          ? Number(filters.categoryId)
          : undefined,
        city: filters.city.trim() || undefined,
        limit: 100,
      });
      setOpenRequests(
        list.filter((jr) => matchesKeyword(jr, filters.keyword)),
      );
    },
    [],
  );

  useEffect(() => {
    categoriesApi
      .getCategories()
      .then((r) => setCategories(r.categories))
      .catch(() => {});
    servicesApi
      .listCities()
      .then((list) =>
        setCities(
          [...list].sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" }),
          ),
        ),
      )
      .catch(() => setCities([]));
  }, []);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    const run = async () => {
      try {
        if (user.role === "customer") {
          await loadCustomer();
        } else if (user.role === "provider" || user.role === "admin") {
          await loadProvider(appliedFilters);
        }
      } catch {
        if (!cancelled) setError(t("list.loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, loadCustomer, loadProvider, appliedFilters, t]);

  const customerTabCounts = useMemo(() => {
    const active = myRequests.filter((r) => r.status === "open").length;
    const completed = myRequests.filter((r) => r.status === "closed").length;
    const cancelled = myRequests.filter((r) => r.status === "cancelled").length;
    return {
      all: myRequests.length,
      active,
      completed,
      cancelled,
    };
  }, [myRequests]);

  const filteredCustomerRows = useMemo(() => {
    switch (customerTab) {
      case "active":
        return myRequests.filter((r) => r.status === "open");
      case "completed":
        return myRequests.filter((r) => r.status === "closed");
      case "cancelled":
        return myRequests.filter((r) => r.status === "cancelled");
      default:
        return myRequests;
    }
  }, [myRequests, customerTab]);

  const applyProviderFilters = () => {
    setAppliedFilters({
      categoryId: draftCategoryId,
      city: draftCity,
      keyword: draftKeyword,
    });
  };

  const clearProviderFilters = () => {
    setDraftCategoryId("");
    setDraftCity("");
    setDraftKeyword("");
    setAppliedFilters(EMPTY_APPLIED);
  };

  const removeFilterChip = (key: "category" | "city" | "keyword") => {
    if (key === "category") {
      setDraftCategoryId("");
      setAppliedFilters((prev) => ({ ...prev, categoryId: "" }));
    } else if (key === "city") {
      setDraftCity("");
      setAppliedFilters((prev) => ({ ...prev, city: "" }));
    } else {
      setDraftKeyword("");
      setAppliedFilters((prev) => ({ ...prev, keyword: "" }));
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        <RequestsListSkeleton count={3} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-slate-700 mb-4">{t("list.signInPrompt")}</p>
        <Link
          href="/login"
          className="inline-flex px-6 py-2.5 bg-[#486284] text-white font-semibold rounded-xl hover:bg-[#3a5270]"
        >
          {t("list.signIn")}
        </Link>
      </div>
    );
  }

  if (user.role === "provider" || user.role === "admin") {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t("list.providerTitle")}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {t("list.providerSubtitle")}
          </p>
        </header>

        <OpenRequestsFilters
          categories={categories}
          cities={cities}
          draftCategoryId={draftCategoryId}
          draftCity={draftCity}
          draftKeyword={draftKeyword}
          applied={appliedFilters}
          onDraftCategoryChange={setDraftCategoryId}
          onDraftCityChange={setDraftCity}
          onDraftKeywordChange={setDraftKeyword}
          onApply={applyProviderFilters}
          onClear={clearProviderFilters}
          onRemoveChip={removeFilterChip}
          resultCount={loading ? undefined : openRequests.length}
        />

        {error ? (
          <p className="text-sm text-red-600 mb-4 rounded-lg bg-red-50 px-4 py-3 border border-red-100">
            {error}
          </p>
        ) : null}

        {loading ? (
          <RequestsListSkeleton />
        ) : openRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <p className="text-slate-600 font-medium">
              {t("list.noMatchFilters")}
            </p>
            <button
              type="button"
              onClick={clearProviderFilters}
              className="mt-3 text-sm font-semibold text-[#486284] hover:underline"
            >
              {t("list.clearFilters")}
            </button>
          </div>
        ) : (
          <ul className="space-y-4">
            {openRequests.map((jr) => (
              <JobRequestCard
                key={jr.id}
                jr={jr}
                variant="provider"
                categories={categories}
              />
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t("list.customerTitle")}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {t("list.customerSubtitle")}
          </p>
        </div>
        <Link
          href="/requests/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#486284] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a5270] transition-colors shadow-sm shrink-0"
        >
          <span className="text-lg leading-none" aria-hidden>
            +
          </span>
          {t("list.postRequest")}
        </Link>
      </header>

      {myRequests.length > 0 ? (
        <CustomerStatusTabs
          active={customerTab}
          counts={customerTabCounts}
          onChange={setCustomerTab}
        />
      ) : null}

      {error ? (
        <p className="text-sm text-red-600 mb-4 rounded-lg bg-red-50 px-4 py-3 border border-red-100">
          {error}
        </p>
      ) : null}

      {loading ? (
        <RequestsListSkeleton />
      ) : filteredCustomerRows.length === 0 && myRequests.length === 0 ? (
        <CustomerRequestsEmpty />
      ) : filteredCustomerRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-slate-600">{t("list.emptyTab")}</p>
          <button
            type="button"
            onClick={() => setCustomerTab("all")}
            className="mt-2 text-sm font-semibold text-[#486284] hover:underline"
          >
            {t("list.showAll")}
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredCustomerRows.map((jr) => (
            <JobRequestCard
              key={jr.id}
              jr={jr}
              variant="customer"
              categories={categories}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
