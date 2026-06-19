"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { i18n } from "@/lib/i18n/client";

export default function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? i18n.language;

    const onLanguageChanged = (lng: string) => {
      document.documentElement.lang = lng;
    };
    i18n.on("languageChanged", onLanguageChanged);
    return () => {
      i18n.off("languageChanged", onLanguageChanged);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
