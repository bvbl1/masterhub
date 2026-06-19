"use client";

import Link from "next/link";
import {
  HiOutlineBanknotes,
  HiOutlineChevronRight,
  HiOutlineClock,
  HiOutlineMapPin,
} from "react-icons/hi2";
import type { Category, JobRequest } from "@/lib/api";
import { formatCurrencyRange } from "@/lib/formatCurrency";
import { categoryVisual } from "@/lib/requests/categoryVisual";
import { useRequestsTranslation } from "@/lib/i18n/useRequestsTranslation";

function StatusPill({
  status,
  label,
}: {
  status: JobRequest["status"];
  label: string;
}) {
  const styles: Record<string, string> = {
    open: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    closed: "bg-slate-100 text-slate-700 ring-slate-200",
    cancelled: "bg-amber-50 text-amber-900 ring-amber-100",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${
        styles[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {label}
    </span>
  );
}

function bidsBoxClass(count: number, status: JobRequest["status"]): string {
  if (status !== "open") return "bg-slate-100 text-slate-600";
  if (count >= 3) return "bg-[#486284] text-white";
  if (count > 0) return "bg-[#486284]/15 text-[#486284]";
  return "bg-slate-100 text-slate-500";
}

type JobRequestCardProps = {
  jr: JobRequest;
  variant: "customer" | "provider";
  categories?: Category[];
};

export default function JobRequestCard({
  jr,
  variant,
  categories = [],
}: JobRequestCardProps) {
  const {
    t,
    formatPostedAt,
    formatCompletedAt,
    formatTimeAgoShort,
    bidCountLabel,
    statusLabel,
  } = useRequestsTranslation();

  const href = `/requests/${jr.id}`;
  const { palette, initial } = categoryVisual(jr.categoryId, categories);
  const postedLabel =
    jr.status === "closed"
      ? formatCompletedAt(jr.updatedAt ?? jr.createdAt)
      : formatPostedAt(jr.createdAt);
  const timeAgoLabel = formatTimeAgoShort(jr.createdAt);

  if (variant === "customer") {
    return (
      <li>
        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={jr.status} label={statusLabel(jr.status)} />
                  {postedLabel ? (
                    <span className="text-xs text-slate-400">{postedLabel}</span>
                  ) : null}
                </div>
                <Link
                  href={href}
                  className="mt-2 block text-lg font-bold text-slate-900 hover:text-[#486284] line-clamp-2"
                >
                  {jr.title}
                </Link>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <HiOutlineMapPin className="h-4 w-4 text-slate-400" />
                    {jr.city || "—"}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium tabular-nums">
                    <HiOutlineBanknotes className="h-4 w-4 text-slate-400" />
                    {formatCurrencyRange(jr.budgetMin, jr.budgetMax)}
                  </span>
                </div>
              </div>

              <div className="flex sm:flex-col items-stretch gap-2 shrink-0 sm:min-w-[140px]">
                <div
                  className={`rounded-xl px-4 py-3 text-center text-sm font-semibold ${bidsBoxClass(
                    jr.responseCount,
                    jr.status,
                  )}`}
                >
                  {jr.status === "open"
                    ? bidCountLabel(jr.responseCount)
                    : t("card.noActiveBids")}
                </div>
                <Link
                  href={href}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  {jr.status === "open" ? t("card.manage") : t("card.viewDetails")}
                </Link>
              </div>
            </div>
          </div>
        </article>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all hover:border-[#486284]/35 hover:shadow-md"
      >
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold ring-1 ${palette.bg} ${palette.text} ${palette.ring}`}
        >
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#486284] line-clamp-2">
            {jr.title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">
              <HiOutlineMapPin className="h-4 w-4 shrink-0" />
              {jr.city || "—"}
            </span>
            {timeAgoLabel ? (
              <span className="inline-flex items-center gap-1">
                <HiOutlineClock className="h-4 w-4 shrink-0" />
                {timeAgoLabel}
              </span>
            ) : null}
          </div>
          {jr.description?.trim() ? (
            <p className="mt-3 text-sm text-slate-500 line-clamp-2 leading-relaxed">
              {jr.description}
            </p>
          ) : null}
        </div>

        <div className="hidden sm:flex flex-col items-end justify-between shrink-0 pl-2">
          <p className="text-sm font-bold text-slate-900 tabular-nums text-right">
            {formatCurrencyRange(jr.budgetMin, jr.budgetMax)}
          </p>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-200 group-hover:bg-[#486284]/10 group-hover:text-[#486284]">
            <HiOutlineChevronRight className="h-5 w-5" />
          </span>
        </div>
      </Link>
    </li>
  );
}
