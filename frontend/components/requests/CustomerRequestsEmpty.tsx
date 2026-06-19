"use client";

import Link from "next/link";
import { useRequestsTranslation } from "@/lib/i18n/useRequestsTranslation";

export default function CustomerRequestsEmpty() {
  const { t } = useRequestsTranslation();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#486284]/10 text-[#486284]">
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h2 className="mt-5 text-lg font-bold text-slate-900">
        {t("empty.title")}
      </h2>
      <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
        {t("empty.desc")}
      </p>
      <Link
        href="/requests/new"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#486284] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3a5270] transition-colors shadow-sm"
      >
        <span aria-hidden>+</span>
        {t("empty.cta")}
      </Link>

      <div className="mt-10 grid gap-4 sm:grid-cols-3 text-left">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-sm font-semibold text-slate-800">
            {t("empty.verifiedTitle")}
          </p>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            {t("empty.verifiedDesc")}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-sm font-semibold text-slate-800">
            {t("empty.fastTitle")}
          </p>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            {t("empty.fastDesc")}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-sm font-semibold text-slate-800">
            {t("empty.clearTitle")}
          </p>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            {t("empty.clearDesc")}
          </p>
        </div>
      </div>
    </div>
  );
}
