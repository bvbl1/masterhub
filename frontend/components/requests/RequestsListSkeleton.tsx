"use client";

import { useRequestsTranslation } from "@/lib/i18n/useRequestsTranslation";

export default function RequestsListSkeleton({ count = 4 }: { count?: number }) {
  const { t } = useRequestsTranslation();

  return (
    <ul className="space-y-4" aria-busy="true" aria-label={t("skeleton.loading")}>
      {Array.from({ length: count }, (_, i) => (
        <li
          key={i}
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 animate-pulse"
        >
          <div className="flex gap-4">
            <div className="h-14 w-14 shrink-0 rounded-xl bg-slate-200" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-4 w-2/5 rounded bg-slate-200" />
              <div className="h-3 w-1/3 rounded bg-slate-100" />
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-4/5 rounded bg-slate-100" />
            </div>
            <div className="hidden sm:block h-8 w-24 shrink-0 rounded bg-slate-200" />
          </div>
        </li>
      ))}
    </ul>
  );
}
