"use client";

import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";

export function useAuthTranslation() {
  const { t, i18n: inst } = useTranslation("auth", { i18n });

  const resolveOAuthError = (codeOrMessage: string): string => {
    let decoded = codeOrMessage;
    try {
      decoded = decodeURIComponent(codeOrMessage);
    } catch {
      /* use raw */
    }
    if (decoded === "google_cancelled") return t("oauth.google_cancelled");
    if (decoded === "no_token") return t("oauth.no_token");
    if (decoded === "exchange_failed") return t("oauth.exchange_failed");
    return decoded;
  };

  return { t, i18n: inst, resolveOAuthError };
}
