"use client";

import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import {
  defaultLocale,
  isLocale,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "./settings";
import enCommon from "./locales/en/common.json";
import ruCommon from "./locales/ru/common.json";
import kkCommon from "./locales/kk/common.json";
import enOrders from "./locales/en/orders.json";
import ruOrders from "./locales/ru/orders.json";
import kkOrders from "./locales/kk/orders.json";
import enFavorites from "./locales/en/favorites.json";
import ruFavorites from "./locales/ru/favorites.json";
import kkFavorites from "./locales/kk/favorites.json";
import enAdmin from "./locales/en/admin.json";
import ruAdmin from "./locales/ru/admin.json";
import kkAdmin from "./locales/kk/admin.json";
import enProvider from "./locales/en/provider.json";
import ruProvider from "./locales/ru/provider.json";
import kkProvider from "./locales/kk/provider.json";
import enProviderServices from "./locales/en/providerServices.json";
import ruProviderServices from "./locales/ru/providerServices.json";
import kkProviderServices from "./locales/kk/providerServices.json";
import enRequests from "./locales/en/requests.json";
import ruRequests from "./locales/ru/requests.json";
import kkRequests from "./locales/kk/requests.json";
import enAuth from "./locales/en/auth.json";
import ruAuth from "./locales/ru/auth.json";
import kkAuth from "./locales/kk/auth.json";
import enHome from "./locales/en/home.json";
import ruHome from "./locales/ru/home.json";
import kkHome from "./locales/kk/home.json";
import enChat from "./locales/en/chat.json";
import ruChat from "./locales/ru/chat.json";
import kkChat from "./locales/kk/chat.json";

const resources = {
  en: {
    common: enCommon,
    orders: enOrders,
    favorites: enFavorites,
    admin: enAdmin,
    provider: enProvider,
    providerServices: enProviderServices,
    requests: enRequests,
    auth: enAuth,
    home: enHome,
    chat: enChat,
  },
  ru: {
    common: ruCommon,
    orders: ruOrders,
    favorites: ruFavorites,
    admin: ruAdmin,
    provider: ruProvider,
    providerServices: ruProviderServices,
    requests: ruRequests,
    auth: ruAuth,
    home: ruHome,
    chat: ruChat,
  },
  kk: {
    common: kkCommon,
    orders: kkOrders,
    favorites: kkFavorites,
    admin: kkAdmin,
    provider: kkProvider,
    providerServices: kkProviderServices,
    requests: kkRequests,
    auth: kkAuth,
    home: kkHome,
    chat: kkChat,
  },
} as const;

function createI18nInstance() {
  const instance = i18next.createInstance();

  const chain = instance.use(initReactI18next);
  if (typeof window !== "undefined") {
    chain.use(LanguageDetector);
  }

  void chain.init({
    resources,
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    supportedLngs: ["en", "ru", "kk"],
    ns: [
      "common",
      "orders",
      "favorites",
      "admin",
      "provider",
      "providerServices",
      "requests",
      "auth",
      "home",
      "chat",
    ],
    defaultNS: "common",
    fallbackNS: "common",
    interpolation: { escapeValue: false },
    detection:
      typeof window !== "undefined"
        ? {
            order: ["localStorage", "navigator"],
            lookupLocalStorage: LOCALE_STORAGE_KEY,
            caches: ["localStorage"],
            convertDetectedLanguage: (lng) => {
              const base = lng.split("-")[0]?.toLowerCase() ?? defaultLocale;
              if (base === "kz") return "kk";
              return isLocale(base) ? base : defaultLocale;
            },
          }
        : undefined,
    react: { useSuspense: false },
  });

  return instance;
}

/** Shared i18n instance (initialized on first import). */
export const i18n = createI18nInstance();

export async function setAppLanguage(locale: Locale) {
  await i18n.changeLanguage(locale);
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }
}
