"use client";

import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";
import type { OrderStatus, ProviderApplicationStatus } from "@/lib/api";

export function useAdminTranslation() {
  const { t, i18n: inst } = useTranslation("admin", { i18n });

  const orderStatusLabel = (status: OrderStatus | string) =>
    t(`orderStatus.${status}`, { defaultValue: String(status).replace(/_/g, " ") });

  const applicationStatusLabel = (status: ProviderApplicationStatus | string) =>
    t(`appStatus.${status}`, { defaultValue: status });

  return { t, i18n: inst, orderStatusLabel, applicationStatusLabel };
}
