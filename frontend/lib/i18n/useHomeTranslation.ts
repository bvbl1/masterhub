"use client";

import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";

export type HomeServiceTabId =
  | "construction"
  | "renovation"
  | "installation"
  | "repair";

export const HOME_SERVICE_TAB_IDS: HomeServiceTabId[] = [
  "construction",
  "renovation",
  "installation",
  "repair",
];

export function useHomeTranslation() {
  const { t, i18n: inst } = useTranslation("home", { i18n });

  const serviceTabLabel = (id: HomeServiceTabId) =>
    t(`services.tabs.${id}` as const);

  return { t, i18n: inst, serviceTabLabel, HOME_SERVICE_TAB_IDS };
}
