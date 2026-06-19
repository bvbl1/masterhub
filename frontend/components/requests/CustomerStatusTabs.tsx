"use client";

import { useRequestsTranslation } from "@/lib/i18n/useRequestsTranslation";

export type CustomerRequestTab = "all" | "active" | "completed" | "cancelled";

type TabDef = { id: CustomerRequestTab; label: string };

type CustomerStatusTabsProps = {
  active: CustomerRequestTab;
  counts: Record<CustomerRequestTab, number>;
  onChange: (tab: CustomerRequestTab) => void;
};

export default function CustomerStatusTabs({
  active,
  counts,
  onChange,
}: CustomerStatusTabsProps) {
  const { t } = useRequestsTranslation();

  const tabs: TabDef[] = [
    { id: "all", label: t("tabs.all") },
    { id: "active", label: t("tabs.active", { count: counts.active }) },
    { id: "completed", label: t("tabs.completed") },
    { id: "cancelled", label: t("tabs.cancelled") },
  ];

  return (
    <nav
      className="flex gap-6 border-b border-slate-200 mb-6 "
      aria-label={t("tabs.ariaLabel")}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              isActive
                ? "border-[#486284] text-[#486284]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
