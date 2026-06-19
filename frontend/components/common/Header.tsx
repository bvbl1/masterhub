"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";
import LangSwitcher from "./LangSwitcher";
import { useAuth } from "@/lib/context/AuthContext";
import { useModalStore } from "@/lib/store/modalStore";
import CreateServiceModal from "./CreateServiceModal";
import ProfileMenu from "./ProfileMenu";

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavKey =
  | "dashboard"
  | "adminPanel"
  | "requests"
  | "chat"
  | "myServices"
  | "orders";

export default function Header() {
  const pathname = usePathname();
  const { t } = useTranslation("common", { i18n });
  const { user, loading } = useAuth();
  const { openModal } = useModalStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = useMemo((): { key: NavKey; href: string }[] => {
    if (user?.role === "admin") {
      return [
        { key: "dashboard", href: "/dashboard" },
        { key: "adminPanel", href: "/admin" },
        { key: "requests", href: "/requests" },
        { key: "chat", href: "/chat" },
      ];
    }
    if (user?.role === "provider") {
      return [
        { key: "dashboard", href: "/dashboard" },
        { key: "myServices", href: "/provider-services" },
        { key: "orders", href: "/orders" },
        { key: "requests", href: "/requests" },
        { key: "chat", href: "/chat" },
      ];
    }
    return [
      { key: "dashboard", href: "/dashboard" },
      { key: "orders", href: "/orders" },
      { key: "requests", href: "/requests" },
      { key: "chat", href: "/chat" },
    ];
  }, [user?.role]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-[#E2E8F0]">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3 py-3 px-4 sm:py-4 sm:px-6">
        <Link
          href="/dashboard"
          className="text-lg sm:text-xl font-bold text-[#1E293B] shrink-0 min-w-0"
        >
          Masterhub
        </Link>

        <ul className="hidden lg:flex items-end gap-1 flex-1 justify-center min-w-0">
          {navItems.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`inline-block px-3 xl:px-4 pt-2 pb-2.5 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? "border-[#486284] text-[#486284]"
                      : "border-transparent text-[#64748B] hover:text-[#1E293B]"
                  }`}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <LangSwitcher />
          {/* <Link
            href="/chat"
            className="relative p-2 rounded-lg hover:bg-gray-50 shrink-0"
            aria-label="Chat"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M0 20V2C0 1.45.196.979.588.588A1.93 1.93 0 012 0h16c.55 0 1.021.196 1.413.588.391.391.587.862.587 1.412v12c0 .55-.196 1.021-.587 1.413A1.93 1.93 0 0118 16H4L0 20z"
                fill={pathname.startsWith("/chat") ? "#486284" : "#94A3B8"}
              />
            </svg>
          </Link> */}
          {!loading && user ? (
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <ProfileMenu variant="full" />
            </div>
          ) : !loading ? (
            <Link
              href="/login"
              className="hidden sm:inline-flex px-3 sm:px-4 py-2 bg-[#486284] text-white text-sm font-medium rounded-lg hover:bg-[#3a5270] transition-colors"
            >
              {t("auth.signIn")}
            </Link>
          ) : null}

          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-[#1E293B]"
            aria-expanded={mobileNavOpen}
            aria-label={
              mobileNavOpen ? t("header.closeMenu") : t("header.openMenu")
            }
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            {mobileNavOpen ? (
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  d="M4 7h16M4 12h16M4 17h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileNavOpen && (
        <>
          <button
            type="button"
            className="fixed left-0 right-0 bottom-0 top-14 sm:top-16 z-45 cursor-default bg-black/30 lg:hidden"
            aria-hidden
            tabIndex={-1}
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-55 lg:hidden border-t border-[#E2E8F0] bg-white shadow-lg">
            <div className="max-w-[1200px] mx-auto px-4 py-4 flex flex-col gap-1">
              <div className="flex sm:hidden items-center justify-between pb-3 border-b border-gray-100 mb-2">
                <LangSwitcher />
                {!loading && user ? (
                  <ProfileMenu
                    variant="compact"
                    onNavigate={() => setMobileNavOpen(false)}
                  />
                ) : !loading ? (
                  <Link
                    href="/login"
                    className="px-3 py-2 bg-[#486284] text-white text-sm font-medium rounded-lg"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    {t("auth.signIn")}
                  </Link>
                ) : null}
              </div>
              {navItems.map((item) => {
                const isActive = isNavItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`px-3 py-3 text-sm font-medium min-h-[44px] flex items-center border-b-2 transition-colors ${
                      isActive
                        ? "border-[#486284] text-[#486284]"
                        : "border-transparent text-[#64748B]"
                    }`}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                );
              })}
              {user ? (
                <>
                  {user.role === "provider" ? (
                    <button
                      type="button"
                      className="text-left px-3 py-3 text-sm font-medium min-h-[44px] border-b-2 border-transparent text-[#64748B]"
                      onClick={() => {
                        setMobileNavOpen(false);
                        openModal(<CreateServiceModal />);
                      }}
                    >
                      {t("nav.createService")}
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
