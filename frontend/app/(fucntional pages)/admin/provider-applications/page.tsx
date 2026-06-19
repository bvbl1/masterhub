"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  ApiError,
  authApi,
  providerApplicationApi,
  type ProviderApplication,
  type ProviderApplicationStatus,
  type User,
} from "@/lib/api";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type StatusFilter = "" | ProviderApplicationStatus;

function applicationStatusBadge(
  status: ProviderApplicationStatus,
  label: string,
): {
  label: string;
  className: string;
} {
  switch (status) {
    case "pending":
      return { label: "", className: "" };
    case "approved":
      return {
        label,
        className:
          "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/90 shadow-sm",
      };
    case "rejected":
      return {
        label,
        className: "bg-red-50 text-red-900 ring-1 ring-red-200/90 shadow-sm",
      };
    default:
      return {
        label,
        className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
      };
  }
}

function formatSubmittedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminProviderApplicationsPage() {
  const { t, applicationStatusLabel } = useAdminTranslation();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [rows, setRows] = useState<ProviderApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applicantByUserId, setApplicantByUserId] = useState<
    Record<string, User | null>
  >({});
  const applicantFetchStarted = useRef(new Set<string>());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { applications, total: t } =
        await providerApplicationApi.listProviderApplicationsAdmin({
          status: statusFilter,
          limit: 100,
          offset: 0,
        });
      setRows(applications);
      setTotal(t);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.body.message ?? e.body.error ?? t("applications.loadError"));
      } else {
        setError(t("applications.loadError"));
      }
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    if (authLoading || !user || user.role !== "admin") return;
    void load();
  }, [authLoading, user, load]);

  useEffect(() => {
    if (authLoading || user?.role !== "admin" || rows.length === 0) return;
    const uids = [...new Set(rows.map((r) => r.userId))];
    for (const uid of uids) {
      if (applicantFetchStarted.current.has(uid)) continue;
      applicantFetchStarted.current.add(uid);
      void authApi
        .getProviderInfo(uid)
        .then(({ user: u }) => {
          setApplicantByUserId((p) => ({ ...p, [uid]: u }));
        })
        .catch(() => {
          setApplicantByUserId((p) => ({ ...p, [uid]: null }));
        });
    }
  }, [rows, user?.role, authLoading]);

  if (authLoading) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 py-16 text-center text-gray-500">
        {t("common.loading")}
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-[1100px] mx-auto px-4 py-16 text-center">
        <p className="text-gray-700 mb-4">{t("common.adminOnly")}</p>
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
    <div className=" px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("applications.title")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("applications.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["pending", "applications.filterPending"],
              ["", "applications.filterAll"],
              ["approved", "applications.filterApproved"],
              ["rejected", "applications.filterRejected"],
            ] as const
          ).map(([value, labelKey]) => (
            <button
              key={value || "all"}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === value
                  ? "bg-[#486284] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-gray-500 text-center py-16">
          {t("applications.loadingList")}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 text-center py-16">
          {t("applications.emptyFilter")}
        </p>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">
            {t("common.total", { count: total })}
          </p>
          <ul className="space-y-5">
            {rows.map((app) => {
              const applicant = applicantByUserId[app.userId];
              const badge = applicationStatusBadge(
                app.status,
                applicationStatusLabel(app.status),
              );
              const detailHref = `/admin/provider-applications/${app.id}`;
              const titleText =
                applicant === undefined
                  ? t("applications.loadingApplicant")
                  : applicant === null
                    ? t("applications.applicantUnavailable")
                    : `${applicant.firstName} ${applicant.secondName}`.trim() ||
                      "—";
              return (
                <li key={app.id}>
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_2px_14px_rgba(15,23,42,0.07)] overflow-hidden ring-1 ring-black/[0.02]">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(detailHref)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(detailHref);
                        }
                      }}
                      className="p-5 sm:p-6 flex gap-4 sm:gap-5 cursor-pointer text-left hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="relative h-14 w-14 shrink-0 rounded-full overflow-hidden bg-stone-100 ring-2 ring-white shadow-sm">
                        {applicant?.avatarUrl ? (
                          <Image
                            src={applicant.avatarUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-lg font-semibold bg-stone-100">
                            {applicant != null
                              ? (
                                  `${applicant.firstName} ${applicant.secondName}`.trim() ||
                                  applicant.email ||
                                  "?"
                                )
                                  .charAt(0)
                                  .toUpperCase()
                              : "…"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg sm:text-[1.125rem] font-bold text-gray-900 leading-snug truncate">
                            {titleText}
                          </h2>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            <span className="font-medium text-slate-700">
                              {t("applications.applicationNumber", {
                                id: app.id,
                              })}
                            </span>
                            <span className="mx-2 text-gray-300" aria-hidden>
                              •
                            </span>
                            <span className="text-gray-500">
                              {t("applications.submitted")}{" "}
                              {app.createdAt
                                ? formatSubmittedDate(app.createdAt)
                                : "—"}
                            </span>
                          </p>
                        </div>
                        <div className="shrink-0 flex flex-col items-start sm:items-end gap-2 sm:pt-0.5">
                          <span className="text-xs font-semibold tabular-nums text-gray-500 tracking-tight">
                            #{app.id}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 bg-slate-50/50 px-5 sm:px-6 py-3 sm:py-3.5 flex flex-wrap items-center justify-end gap-3 sm:gap-4">
                      <button
                        type="button"
                        onClick={() => router.push(detailHref)}
                        className="rounded-lg bg-slate-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 active:bg-slate-800 transition-colors min-h-[44px] sm:min-h-0"
                      >
                        {t("applications.reviewApplication")}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
