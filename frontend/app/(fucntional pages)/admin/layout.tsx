"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiBarChart2, FiClipboard, FiList } from "react-icons/fi";
import { HiOutlineScale } from "react-icons/hi2";
import { useAuth } from "@/lib/context/AuthContext";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminNavItem = {
  id: string;
  labelKey: "analytics" | "categories" | "applications" | "disputes";
  href: string;
  available: boolean;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: "analytics",
    labelKey: "analytics",
    href: "/admin/analytics",
    available: true,
    icon: FiBarChart2,
  },
  {
    id: "categories",
    labelKey: "categories",
    href: "/admin/categories",
    available: true,
    icon: FiList,
  },
  {
    id: "provider-applications",
    labelKey: "applications",
    href: "/admin/provider-applications",
    available: true,
    icon: FiClipboard,
  },
  {
    id: "disputes",
    labelKey: "disputes",
    href: "/admin/disputes",
    available: true,
    icon: HiOutlineScale,
  },
];

function navActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminNavLink({
  item,
  active,
  compact,
  label,
  soonLabel,
}: {
  item: AdminNavItem;
  active: boolean;
  compact?: boolean;
  label: string;
  soonLabel: string;
}) {
  const Icon = item.icon;

  if (!item.available) {
    return (
      <span
        className={`flex items-center gap-3 rounded-xl px-4 text-slate-300 ${
          compact ? "py-2.5 shrink-0" : "py-3.5"
        }`}
        aria-disabled
      >
        <Icon className="h-[22px] w-[22px] shrink-0" aria-hidden />
        <span className="text-[15px] font-medium whitespace-nowrap">
          {label}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {soonLabel}
        </span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-5 mt-2 rounded-xl px-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#486284]/40 focus-visible:ring-offset-2 ${
        compact ? "py-2.5 shrink-0" : "py-3.5"
      } ${
        active
          ? "border border-slate-100 bg-white text-slate-800 shadow-xs"
          : "border border-slate-50 text-slate-500 hover:text-slate-600"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className={`h-[22px] w-[22px] shrink-0 ${
          active ? "text-slate-800" : "text-current"
        }`}
        aria-hidden
      />
      <span className="text-[15px] font-medium whitespace-nowrap">{label}</span>
    </Link>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { t } = useAdminTranslation();

  if (loading) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-16 text-center text-gray-500">
        {t("common.loading")}
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-[1400px] flex-col lg:flex-row">
      <aside
        className="hidden mt-10 pb-20 h-fit rounded-2xl ring ring-slate-200 shrink-0 border-r border-slate-100 bg-white lg:block lg:w-[220px] xl:w-[240px]"
        aria-label={t("common.navAria")}
      >
        <nav className="flex flex-col gap-1 px-4 py-8">
          {ADMIN_NAV_ITEMS.map((item) => (
            <AdminNavLink
              key={item.id}
              item={item}
              active={item.available && navActive(pathname, item.href)}
              label={t(`nav.${item.labelKey}`)}
              soonLabel={t("common.soon")}
            />
          ))}
        </nav>
      </aside>

      <nav
        className="flex gap-1 overflow-x-auto border-b border-slate-100 bg-white px-3 py-2 lg:hidden"
        aria-label={t("common.navAria")}
      >
        {ADMIN_NAV_ITEMS.map((item) => (
          <AdminNavLink
            key={item.id}
            item={item}
            active={item.available && navActive(pathname, item.href)}
            compact
            label={t(`nav.${item.labelKey}`)}
            soonLabel={t("common.soon")}
          />
        ))}
      </nav>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
