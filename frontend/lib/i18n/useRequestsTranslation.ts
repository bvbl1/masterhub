"use client";

import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";

function dateLocaleFor(lang: string): string {
  if (lang === "ru") return "ru-RU";
  if (lang === "kk") return "kk-KZ";
  return "en-US";
}

function formatShortDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

export function useRequestsTranslation() {
  const { t, i18n: inst } = useTranslation("requests", { i18n });
  const locale = dateLocaleFor(inst.language);

  const plural = (base: string, count: number) =>
    count === 1 ? t(`${base}_one`, { count }) : t(base, { count });

  const formatPostedAt = (iso?: string): string => {
    if (!iso?.trim()) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";

    const diffSec = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 1000),
    );
    if (diffSec < 60) return t("time.postedJustNow");

    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return plural("time.postedMinutesAgo", mins);

    const hours = Math.floor(mins / 60);
    if (hours < 24) return plural("time.postedHoursAgo", hours);

    const days = Math.floor(hours / 24);
    if (days < 14) return plural("time.postedDaysAgo", days);

    return t("time.postedOn", { date: formatShortDate(date, locale) });
  };

  const formatTimeAgoShort = (iso?: string): string => {
    if (!iso?.trim()) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";

    const diffSec = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 1000),
    );
    if (diffSec < 60) return t("time.justNow");

    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return plural("time.minutesAgo", mins);

    const hours = Math.floor(mins / 60);
    if (hours < 24) return plural("time.hoursAgo", hours);

    const days = Math.floor(hours / 24);
    if (days < 14) return plural("time.daysAgo", days);

    return t("time.onDate", { date: formatShortDate(date, locale) });
  };

  const formatCompletedAt = (iso?: string): string => {
    if (!iso?.trim()) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return t("time.completedOn", { date: formatShortDate(date, locale) });
  };

  const formatWhen = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const bidCountLabel = (count: number) =>
    count === 1
      ? t("card.bidReceived_one")
      : t("card.bidReceived", { count });

  const openRequestCountLabel = (count: number) =>
    count === 1
      ? t("filters.openCount_one", { count })
      : t("filters.openCount", { count });

  const statusLabel = (status: string) => {
    const key = `status.${status}` as const;
    const map: Record<string, string> = {
      open: t("status.open"),
      closed: t("status.closed"),
      cancelled: t("status.cancelled"),
    };
    return map[status] ?? status;
  };

  const bidStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: t("bidStatus.pending"),
      accepted: t("bidStatus.accepted"),
      rejected: t("bidStatus.rejected"),
      withdrawn: t("bidStatus.withdrawn"),
    };
    return map[status] ?? status;
  };

  return {
    t,
    i18n: inst,
    formatPostedAt,
    formatTimeAgoShort,
    formatCompletedAt,
    formatWhen,
    bidCountLabel,
    openRequestCountLabel,
    statusLabel,
    bidStatusLabel,
    plural,
  };
}
