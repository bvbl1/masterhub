"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiRefreshCw,
  FiShoppingBag,
  FiTrendingUp,
} from "react-icons/fi";
import { HiOutlineBanknotes } from "react-icons/hi2";
import { useAuth } from "@/lib/context/AuthContext";
import { ApiError, analyticsApi, type OrderAnalytics } from "@/lib/api";
import { BiWallet } from "react-icons/bi";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import type { OrderStatus } from "@/lib/api";

type StatusMeta = {
  key: OrderStatus;
  color: string;
  order: number;
};

const STATUS_CATALOG: StatusMeta[] = [
  { key: "pending_provider_acceptance", color: "#7eb8e8", order: 0 },
  { key: "pending_payment", color: "#b8c9d9", order: 1 },
  { key: "rejected_by_provider", color: "#d4a5a5", order: 2 },
  { key: "cancelled", color: "#e8c4b8", order: 3 },
  { key: "in_progress", color: "#486284", order: 4 },
  { key: "pending_customer_confirmation", color: "#9cb89c", order: 5 },
  { key: "completed", color: "#3d6b4f", order: 6 },
  { key: "disputed", color: "#8b3a3a", order: 7 },
];

function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatMoney(n: number): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)} ₸`;
}

function CompletionRing({ rate, growthLabel }: { rate: number; growthLabel: string }) {
  const pct = Math.min(100, Math.max(0, Math.round(rate * 100)));
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative h-[140px] w-[140px] shrink-0">
      <svg
        className="h-full w-full -rotate-90"
        viewBox="0 0 120 120"
        aria-hidden
      >
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#e8edf2"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#486284"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold text-slate-900">{pct}%</span>
        <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-400">
          {growthLabel}
        </span>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  iconBg,
  trend,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
              {value}
            </p>
            {trend ? (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                <FiTrendingUp className="h-3.5 w-3.5" aria-hidden />
                {trend}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-14 rounded-xl bg-white/10" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-40 rounded-2xl bg-white" />
        <div className="h-40 rounded-2xl bg-white" />
      </div>
      <div className="h-64 rounded-2xl bg-white" />
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { t, orderStatusLabel } = useAdminTranslation();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<OrderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"historical" | "realtime">(
    "historical",
  );

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const analytics = await analyticsApi.getOrderAnalytics();
      setData(analytics);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : t("analytics.loadError");
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") return;
    void load();
  }, [authLoading, user, load]);

  const statusSegments = useMemo(() => {
    if (!data) return [];
    const countByKey = new Map(data.byStatus.map((s) => [s.status, s.count]));
    return STATUS_CATALOG.map((meta) => ({
      ...meta,
      label: orderStatusLabel(meta.key),
      count: countByKey.get(meta.key) ?? 0,
    })).filter((s) => s.count > 0 || data.totalOrders === 0);
  }, [data, orderStatusLabel]);

  const statusTotal = useMemo(
    () => statusSegments.reduce((sum, s) => sum + s.count, 0),
    [statusSegments],
  );

  const monthTrend = useMemo(() => {
    if (!data || data.totalOrders === 0) return null;
    const share = (data.ordersThisMonth / data.totalOrders) * 100;
    if (share <= 0) return null;
    return `~${Math.round(share)}%`;
  }, [data]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] bg-[#0a0a0a] px-4 py-16 text-center text-slate-400">
        {t("common.loading")}
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-[60vh] bg-[#0a0a0a] px-4 py-16 text-center">
        <p className="text-slate-300 mb-4">{t("common.adminOnly")}</p>
        <Link
          href="/dashboard"
          className="text-[#7eb8e8] font-medium hover:underline"
        >
          {t("common.backToDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full text-black">
      <div className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
              {t("analytics.title")}
            </h1>
            <p className="mt-1 text-sm text-slate-400">{t("analytics.subtitle")}</p>
          </div>
          <div className="flex items-center gap-4 sm:gap-5">
            <button
              type="button"
              onClick={() => void load(true)}
              disabled={loading || refreshing}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              aria-label={t("analytics.refreshAria")}
            >
              <FiRefreshCw
                className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
            <button
              type="button"
              onClick={() => void load()}
              className="ml-3 font-medium underline"
            >
              {t("common.retry")}
            </button>
          </div>
        ) : null}

        {loading ? (
          <AnalyticsSkeleton />
        ) : data ? (
          <div className="space-y-5">
            {/* KPI row */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label={t("analytics.totalOrders")}
                value={formatCount(data.totalOrders)}
                hint={t("analytics.lifetimeOrders")}
                icon={<FiShoppingBag className="h-5 w-5 text-[#486284]" />}
                iconBg="bg-slate-100"
              />
              <KpiCard
                label={t("analytics.ordersThisMonth")}
                value={formatCount(data.ordersThisMonth)}
                hint={t("analytics.currentUtcMonth")}
                trend={monthTrend ?? undefined}
                icon={<FiCalendar className="h-5 w-5 text-emerald-700" />}
                iconBg="bg-emerald-100"
              />
              <KpiCard
                label={t("analytics.totalRevenue")}
                value={formatMoney(data.totalRevenue)}
                hint={t("analytics.completedOrdersOnly")}
                icon={<HiOutlineBanknotes className="h-5 w-5 text-[#486284]" />}
                iconBg="bg-slate-100"
              />
              <KpiCard
                label={t("analytics.revenueThisMonth")}
                value={formatMoney(data.revenueThisMonth)}
                hint={t("analytics.currentUtcMonth")}
                icon={<BiWallet className="h-5 w-5 text-[#486284]" />}
                iconBg="bg-slate-100"
              />
            </div>

            {/* Middle row */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-5 w-1 rounded-full bg-[#486284]"
                    aria-hidden
                  />
                  <h2 className="text-sm font-semibold text-slate-800">
                    {t("analytics.avgOrderValue")}
                  </h2>
                </div>
                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {formatMoney(data.avgOrderValue)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {t("analytics.perOrderPrice")}
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-semibold tracking-widest text-slate-400">
                    {t("analytics.allOrders")}
                  </span>
                  <svg
                    className="h-8 w-16 text-[#486284]/40"
                    viewBox="0 0 64 32"
                    fill="currentColor"
                    aria-hidden
                  >
                    <rect x="4" y="18" width="8" height="10" rx="1" />
                    <rect x="16" y="12" width="8" height="16" rx="1" />
                    <rect x="28" y="8" width="8" height="20" rx="1" />
                    <rect x="40" y="14" width="8" height="14" rx="1" />
                    <rect x="52" y="6" width="8" height="22" rx="1" />
                  </svg>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-slate-800">
                      {t("analytics.completionRate")}
                    </h2>
                    <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-500">
                      {t("analytics.completionDesc")}
                    </p>
                    {data.totalOrders > 0 ? (
                      <p className="mt-4 text-xs text-slate-500">
                        {t("analytics.completedOf", {
                          completed: formatCount(
                            Math.round(data.completionRate * data.totalOrders),
                          ),
                          total: formatCount(data.totalOrders),
                        })}
                      </p>
                    ) : null}
                  </div>
                  <CompletionRing
                    rate={data.completionRate}
                    growthLabel={t("analytics.growth")}
                  />
                </div>
              </div>
            </div>

            {/* Orders by status */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {t("analytics.ordersByStatus")}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {t("analytics.distribution", {
                      total: formatCount(data.totalOrders),
                    })}
                  </p>
                </div>
                <div
                  className="inline-flex self-start rounded-full bg-slate-100 p-1 text-xs font-medium"
                  role="tablist"
                  aria-label={t("analytics.dataViewAria")}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === "historical"}
                    onClick={() => setViewMode("historical")}
                    className={`rounded-full px-4 py-1.5 transition ${
                      viewMode === "historical"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {t("analytics.historical")}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === "realtime"}
                    onClick={() => setViewMode("realtime")}
                    className={`rounded-full px-4 py-1.5 transition ${
                      viewMode === "realtime"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {t("analytics.realtime")}
                  </button>
                </div>
              </div>

              {statusTotal === 0 ? (
                <p className="mt-10 text-center text-sm text-slate-500 py-8">
                  {t("analytics.noOrdersYet")}
                </p>
              ) : (
                <>
                  <div
                    className="mt-8 flex h-4 w-full overflow-hidden rounded-full bg-slate-100"
                    role="img"
                    aria-label={t("analytics.distributionAria")}
                  >
                    {statusSegments.map((seg) => (
                      <div
                        key={seg.key}
                        style={{
                          width: `${(seg.count / statusTotal) * 100}%`,
                          backgroundColor: seg.color,
                        }}
                        title={`${seg.label}: ${seg.count}`}
                      />
                    ))}
                  </div>

                  <div className="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                    {statusSegments.map((seg) => {
                      if (data.totalOrders > 0 && seg.count === 0) return null;
                      return (
                        <div key={seg.key} className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: seg.color }}
                              aria-hidden
                            />
                            <span className="truncate text-sm font-medium text-slate-700">
                              {seg.label}
                            </span>
                          </div>
                          <p className="mt-1 pl-[18px] text-lg font-bold text-slate-900">
                            {formatCount(seg.count)}{" "}
                            <span className="text-sm font-normal text-slate-400">
                              {t("analytics.ordersWord")}
                            </span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
