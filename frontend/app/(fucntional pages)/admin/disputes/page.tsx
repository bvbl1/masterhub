"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiDownload, FiFilter, FiHome, FiTool, FiZap } from "react-icons/fi";
import { HiArrowsRightLeft, HiOutlineScale } from "react-icons/hi2";
import { useAuth } from "@/lib/context/AuthContext";
import {
  ordersApi,
  type DisputedOrderListEntry,
  type OrderStatus,
} from "@/lib/api";
import { enrichDisputes, type DisputeEnrichment } from "./disputeHelpers";
import PhotoGallery from "@/components/common/PhotoGallery";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0 || name === "—") return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (
    `${parts[0][0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase() ||
    "?"
  );
}

function formatOpened(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function disputeStatusBadge(
  status: OrderStatus,
  label: string,
): {
  label: string;
  className: string;
} {
  switch (status) {
    case "disputed":
      return {
        label,
        className: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",
      };
    case "in_progress":
      return {
        label,
        className: "bg-sky-50 text-sky-800 ring-1 ring-sky-100",
      };
    case "pending_customer_confirmation":
      return {
        label,
        className: "bg-amber-50 text-amber-800 ring-1 ring-amber-100",
      };
    case "completed":
      return {
        label,
        className: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100",
      };
    case "cancelled":
      return {
        label,
        className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
      };
    default:
      return {
        label,
        className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
      };
  }
}

function ServiceCategoryIcon({ title }: { title: string }) {
  const t = title.toLowerCase();
  const Icon =
    t.includes("electric") || t.includes("wiring")
      ? FiZap
      : t.includes("renovat") || t.includes("apartment") || t.includes("house")
        ? FiHome
        : FiTool;
  return <Icon className="h-4 w-4 shrink-0 text-[#486284]" aria-hidden />;
}

function PartyAvatar({
  displayName,
  avatarUrl,
  tone,
}: {
  displayName: string;
  avatarUrl?: string | null;
  tone: "customer" | "provider";
}) {
  const url = avatarUrl?.trim();
  return (
    <div
      className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full shadow-sm ${
        tone === "customer"
          ? "bg-white ring-2 ring-white"
          : "bg-gradient-to-br from-[#4a6282] to-[#3d526d] ring-2 ring-white"
      }`}
    >
      {url ? (
        <Image
          src={url}
          alt=""
          fill
          className="object-cover"
          sizes="48px"
          unoptimized
        />
      ) : (
        <span
          className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
            tone === "customer" ? "text-[#486284]" : "text-white"
          }`}
        >
          {initials(displayName)}
        </span>
      )}
    </div>
  );
}

function DisputeCard({
  entry,
  detail,
}: {
  entry: DisputedOrderListEntry;
  detail?: DisputeEnrichment;
}) {
  const { t, orderStatusLabel } = useAdminTranslation();
  const o = entry.order;
  const href = `/admin/disputes/${entry.disputeId}`;
  const badge = disputeStatusBadge(o.status, orderStatusLabel(o.status));
  const customerName = detail?.customer.name ?? "—";
  const providerName = detail?.provider.name ?? "—";
  const serviceTitle = detail?.serviceTitle ?? "—";
  const reason = entry.disputeReason?.trim() ?? "";
  const disputePhotos = entry.photoUrls ?? o.photoUrls;
  const primaryLabel =
    o.status === "in_progress"
      ? t("disputes.continueReview")
      : t("disputes.openCaseFile");

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d1e3ff]/80 text-[#486284]"
            aria-hidden
          >
            <HiOutlineScale className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">
              {t("disputes.disputeTitle", { id: entry.disputeId })}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {t("disputes.opened", { date: formatOpened(entry.createdAt) })}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-2 lg:gap-6">
        <div className="rounded-xl bg-slate-50/90 p-4 ring-1 ring-inset ring-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {t("disputes.involvedParties")}
          </p>
          <div className="mt-4 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <PartyAvatar
                displayName={customerName}
                avatarUrl={detail?.customer.avatarUrl}
                tone="customer"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {customerName}
                </p>
                <p className="text-xs text-slate-500">{t("common.customer")}</p>
              </div>
            </div>

            <HiArrowsRightLeft
              className="h-5 w-5 shrink-0 text-slate-300"
              aria-hidden
            />

            <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
              <div className="min-w-0 text-right">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {providerName}
                </p>
                <p className="text-xs text-slate-500">{t("common.provider")}</p>
              </div>
              <PartyAvatar
                displayName={providerName}
                avatarUrl={detail?.provider.avatarUrl}
                tone="provider"
              />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#486284]">
            <ServiceCategoryIcon title={serviceTitle} />
            <span className="truncate">{serviceTitle}</span>
          </div>
          {reason ? (
            <blockquote className="rounded-xl border border-dashed border-slate-200 bg-[#fafbfc] px-4 py-3 text-sm italic leading-relaxed text-slate-600 line-clamp-3">
              &ldquo;{reason}&rdquo;
            </blockquote>
          ) : (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
              {t("disputes.noReason")}
            </p>
          )}
          {disputePhotos && disputePhotos.length > 0 ? (
            <PhotoGallery urls={disputePhotos} size="sm" />
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/40 px-5 py-4 sm:px-6">
        <Link
          href={href}
          className="text-sm font-semibold text-[#486284] hover:text-[#3d526d] hover:underline"
        >
          {t("disputes.viewHistory")}
        </Link>
        <Link
          href={href}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#486284] focus-visible:ring-offset-2 ${
            o.status === "in_progress"
              ? "bg-[#486284] text-white hover:bg-[#3d526d]"
              : "bg-[#d1e3ff] text-[#3d526d] hover:bg-[#b8d4f5]"
          }`}
        >
          {primaryLabel}
        </Link>
      </div>
    </article>
  );
}

export default function AdminDisputesPage() {
  const { t, orderStatusLabel } = useAdminTranslation();
  const { user, loading: authLoading } = useAuth();

  const statusFilterOptions: { value: "" | OrderStatus; label: string }[] = [
    { value: "", label: t("disputes.filterAllStatuses") },
    { value: "disputed", label: orderStatusLabel("disputed") },
    { value: "in_progress", label: orderStatusLabel("in_progress") },
    {
      value: "pending_customer_confirmation",
      label: orderStatusLabel("pending_customer_confirmation"),
    },
  ];
  const [entries, setEntries] = useState<DisputedOrderListEntry[]>([]);
  const [detailsByDisputeId, setDetailsByDisputeId] = useState<
    Record<number, DisputeEnrichment>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | OrderStatus>("");
  const [filterOpen, setFilterOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await ordersApi.listDisputedOrders();
      const details = await enrichDisputes(list);
      setEntries(list);
      setDetailsByDisputeId(details);
    } catch {
      setError(t("disputes.loadError"));
      setEntries([]);
      setDetailsByDisputeId({});
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") return;
    void load();
  }, [authLoading, user, load]);

  const filteredEntries = useMemo(() => {
    if (!statusFilter) return entries;
    return entries.filter((e) => e.order.status === statusFilter);
  }, [entries, statusFilter]);

  const totalCount = entries.length;
  const visibleCount = filteredEntries.length;

  if (authLoading) {
    return (
      <div className="min-h-full bg-[#f8f9fb] px-4 py-16 text-center text-slate-500">
        {t("common.loading")}
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-full bg-[#f8f9fb] px-4 py-16 text-center">
        <p className="text-slate-700 mb-4">{t("common.adminAreaOnly")}</p>
        <Link
          href="/dashboard"
          className="text-[#486284] font-medium hover:underline"
        >
          {t("common.backToDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f8f9fb]">
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
              {t("disputes.title")}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-500">
              {t("disputes.subtitle")}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterOpen((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium transition-colors ${
                  filterOpen || statusFilter
                    ? "border-[#486284]/40 text-[#486284]"
                    : "border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
                aria-expanded={filterOpen}
                aria-haspopup="listbox"
              >
                <FiFilter className="h-4 w-4" aria-hidden />
                {t("disputes.filter")}
                {statusFilter ? (
                  <span className="rounded-full bg-[#486284] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    1
                  </span>
                ) : null}
              </button>
              {filterOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label={t("disputes.closeFilter")}
                    onClick={() => setFilterOpen(false)}
                  />
                  <ul
                    role="listbox"
                    className="absolute right-0 z-20 mt-2 min-w-[200px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                  >
                    {statusFilterOptions.map((opt) => (
                      <li key={opt.value || "all"}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={statusFilter === opt.value}
                          onClick={() => {
                            setStatusFilter(opt.value);
                            setFilterOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm ${
                            statusFilter === opt.value
                              ? "bg-slate-50 font-semibold text-[#486284]"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            <button
              type="button"
              onClick={() => void load()}
              className="ml-2 font-semibold underline"
            >
              {t("common.retry")}
            </button>
          </div>
        ) : null}

        {loading ? (
          <div role="status" aria-live="polite">
            <div className="mb-6 flex items-center gap-3 text-sm text-slate-500">
              <span
                className="inline-block h-4 w-4 rounded-full border-2 border-slate-200 border-t-[#486284] animate-spin"
                aria-hidden
              />
              {t("disputes.loading")}
            </div>
            <ul className="space-y-5">
              {[0, 1, 2].map((k) => (
                <li
                  key={k}
                  className="h-[280px] animate-pulse rounded-2xl bg-white ring-1 ring-slate-200/60"
                />
              ))}
            </ul>
          </div>
        ) : totalCount === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm sm:py-20">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d1e3ff]/60 text-[#486284]">
              <HiOutlineScale className="h-6 w-6" />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-800">
              {t("disputes.emptyTitle")}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {t("disputes.emptyDesc")}
            </p>
          </div>
        ) : visibleCount === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-sm text-slate-600">
              {t("disputes.noMatchFilter")}
            </p>
            <button
              type="button"
              onClick={() => setStatusFilter("")}
              className="mt-3 text-sm font-semibold text-[#486284] hover:underline"
            >
              {t("disputes.clearFilter")}
            </button>
          </div>
        ) : (
          <>
            <ul className="space-y-5">
              {filteredEntries.map((entry) => (
                <li key={`dispute-${entry.disputeId}`}>
                  <DisputeCard
                    entry={entry}
                    detail={detailsByDisputeId[entry.disputeId]}
                  />
                </li>
              ))}
            </ul>

            <footer className="mt-8 flex flex-col gap-2 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {statusFilter
                  ? t("disputes.showingFiltered", {
                      visible: visibleCount,
                      total: totalCount,
                    }) + t("disputes.filteredNote")
                  : totalCount === 1
                    ? t("disputes.showingCountOne", { total: totalCount })
                    : t("disputes.showingCountMany", { total: totalCount })}
              </p>
              <p className="text-xs text-slate-400">
                {t("disputes.paginationNote")}
              </p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
