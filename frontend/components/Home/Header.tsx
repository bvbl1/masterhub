"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import LangSwitcher from "@/components/common/LangSwitcher";
import { useHomeTranslation } from "@/lib/i18n/useHomeTranslation";

export default function Header() {
  const { t } = useHomeTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const sections = [
    { title: t("header.navHome"), href: "#home" },
    { title: t("header.navHowItWorks"), href: "#howWorks" },
    { title: t("header.navServices"), href: "#services" },
    { title: t("header.navAbout"), href: "#about" },
  ];

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, closeMenu]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#456186]/15 bg-white/95 backdrop-blur-md shadow-sm lg:absolute lg:shadow-none lg:border-white/20 lg:bg-white/80 lg:py-7">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3 h-14 px-4 sm:h-16 sm:px-6 lg:h-auto lg:px-8 xl:pl-18">
          <Link
            href="#home"
            className="text-lg sm:text-xl lg:text-[32px] font-semibold text-[#1A202C] shrink-0 min-w-0"
            onClick={closeMenu}
          >
            {t("header.brand")}
          </Link>

          {/* Desktop nav */}
          <ul className="hidden lg:flex gap-8 xl:gap-[45px] ml-auto mr-8 xl:mr-36">
            {sections.map((el) => (
              <li
                className="text-[#456186] text-sm xl:text-base font-medium"
                key={el.href}
              >
                <a
                  href={el.href}
                  className="hover:text-[#1A202C] transition-colors"
                >
                  {el.title}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden lg:flex items-center gap-5 xl:gap-8 shrink-0">
            <div className="w-px h-5 bg-[#456186]" />
            <Link
              className="text-[#456186] text-sm font-medium underline hover:text-[#1A202C]"
              href="/registration"
            >
              {t("header.register")}
            </Link>
            <Link
              className="py-2.5 px-5 bg-[#456186] text-sm font-medium text-white rounded-sm hover:bg-[#3a5270] transition-colors"
              href="/login"
            >
              {t("header.login")}
            </Link>
            <LangSwitcher />
          </div>

          {/* Mobile: lang + burger */}
          <div className="flex lg:hidden items-center gap-1 shrink-0">
            <LangSwitcher />
            <button
              type="button"
              className="p-2.5 -mr-1 rounded-xl text-[#456186] hover:bg-[#456186]/10 active:bg-[#456186]/15 transition-colors"
              aria-expanded={menuOpen}
              aria-controls="home-mobile-menu"
              aria-label={
                menuOpen ? t("header.closeMenu") : t("header.openMenu")
              }
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        id="home-mobile-menu"
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="absolute inset-0 bg-[#1A202C]/40 backdrop-blur-[2px]"
          aria-label={t("header.closeMenu")}
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeMenu}
        />

        <aside
          className={`absolute top-0 right-0 flex h-full w-[min(100%,320px)] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 h-14 sm:h-16 shrink-0">
            <span className="text-base font-semibold text-[#1A202C]">
              {t("header.brand")}
            </span>
            <button
              type="button"
              className="p-2 rounded-lg text-[#456186] hover:bg-slate-100"
              aria-label={t("header.closeMenu")}
              onClick={closeMenu}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 18L18 6M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <ul className="flex flex-col gap-1">
              {sections.map((el) => (
                <li key={el.href}>
                  <a
                    href={el.href}
                    className="flex items-center min-h-[48px] px-3 rounded-xl text-base font-medium text-[#456186] hover:bg-[#CED7E4]/40 hover:text-[#1A202C] active:bg-[#CED7E4]/60 transition-colors"
                    onClick={closeMenu}
                  >
                    {el.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="shrink-0 border-t border-[#E2E8F0] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-3">
            <Link
              href="/registration"
              className="flex items-center justify-center min-h-[48px] w-full rounded-xl border-2 border-[#456186] text-[#456186] text-sm font-semibold hover:bg-[#456186]/5 active:bg-[#456284]/10 transition-colors"
              onClick={closeMenu}
            >
              {t("header.register")}
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center min-h-[48px] w-full rounded-xl bg-[#456186] text-white text-sm font-semibold hover:bg-[#3a5270] active:bg-[#334a63] transition-colors"
              onClick={closeMenu}
            >
              {t("header.login")}
            </Link>
          </div>
        </aside>
      </div>

      {/* Spacer so content is not hidden under fixed header (mobile only) */}
      <div className="h-14 sm:h-16 lg:hidden shrink-0" aria-hidden />
    </>
  );
}
