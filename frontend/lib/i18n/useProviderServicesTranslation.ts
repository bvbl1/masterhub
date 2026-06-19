"use client";

import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";

export function useProviderServicesTranslation() {
  const { t, i18n: inst } = useTranslation("providerServices", { i18n });
  return { t, i18n: inst };
}
