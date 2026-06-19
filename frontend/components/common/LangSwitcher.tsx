"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  localeLabels,
  localeNames,
  locales,
  type Locale,
} from "@/lib/i18n/settings";
import { i18n, setAppLanguage } from "@/lib/i18n/client";

export default function LangSwitcher() {
  const { t } = useTranslation("common", { i18n });
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = (i18n.resolvedLanguage ?? i18n.language ?? "en").split(
    "-",
  )[0] as Locale;
  const activeLocale = locales.includes(current) ? current : "en";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectLocale = async (locale: Locale) => {
    await setAppLanguage(locale);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex gap-1 items-center rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("lang.switch")}
      >
        <span className="text-[#456186] text-base font-medium">
          {localeLabels[activeLocale]}
        </span>
        <svg
          width="13"
          height="8"
          viewBox="0 0 13 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.48167 6.99919L6.81948e-06 1.37017L1.40701 -1.09932e-06L6.20359 4.92552L11.1291 0.128935L12.4993 1.53594L6.87027 7.01761C6.68367 7.19927 6.43256 7.29938 6.17216 7.29593C5.91176 7.29247 5.66339 7.18574 5.48167 6.99919Z"
            fill="#6A809C"
          />
        </svg>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={t("lang.switch")}
          className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {locales.map((locale) => {
            const isActive = locale === activeLocale;
            return (
              <li key={locale} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => void selectLocale(locale)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-[#486284]/10 text-[#486284] font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{localeNames[locale]}</span>
                  <span className="text-xs text-slate-400">
                    {localeLabels[locale]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
