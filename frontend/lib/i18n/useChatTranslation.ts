"use client";

import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";

export function useChatTranslation() {
  const { t, i18n: inst } = useTranslation("chat", { i18n });
  return { t, i18n: inst };
}
