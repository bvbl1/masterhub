"use client";

import { useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Order, OrderStatus, UserRole } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";
import { useModalStore } from "@/lib/store/modalStore";
import { useOrdersTranslation } from "@/lib/i18n/useOrdersTranslation";
import type { TFunction } from "i18next";
import OrderPaymentModal from "./OrderPaymentModal";

interface OrderCardProps {
  order: Order;
  serviceTitle?: string;
  role: UserRole;
  /** Имя провайдера (для клиента) или клиента (для провайдера) */
  counterpartyName?: string;
  counterpartyAvatarUrl?: string;
  onAction: (orderId: number, action: string) => void;
  onPaymentSuccess?: () => void | Promise<void>;
}

function getActions(
  status: OrderStatus,
  role: UserRole,
  t: TFunction<"orders">,
): { label: string; action: string; primary: boolean; icon?: "wallet" }[] {
  if (role === "customer") {
    switch (status) {
      case "pending_payment":
        return [
          {
            label: t("actions.payNow"),
            action: "pay",
            primary: true,
            icon: "wallet",
          },
        ];
      case "pending_customer_confirmation":
        return [
          {
            label: t("actions.confirmCompletion"),
            action: "confirm",
            primary: true,
          },
        ];
      case "completed":
        return [
          { label: t("actions.leaveReview"), action: "review", primary: true },
        ];
      case "reviewed":
        return [];
      default:
        return [];
    }
  }

  if (role === "provider") {
    switch (status) {
      case "pending_provider_acceptance":
        return [
          { label: t("actions.acceptOrder"), action: "accept", primary: true },
          { label: t("actions.reject"), action: "reject", primary: false },
        ];
      case "in_progress":
        return [
          { label: t("actions.markDone"), action: "complete", primary: true },
        ];
      default:
        return [];
    }
  }

  return [];
}

const statusPillStyles: Record<OrderStatus, string> = {
  pending_provider_acceptance: "bg-[#fef9c3] text-[#854d0e]",
  pending_payment: "bg-[#e0e7ff] text-[#3730a3]",
  pending_customer_confirmation: "bg-[#fef9c3] text-[#854d0e]",
  in_progress: "bg-[#fef9c3] text-[#854d0e]",
  completed: "bg-[#dcfce7] text-[#166534]",
  reviewed: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-gray-100 text-gray-600",
  rejected_by_provider: "bg-red-50 text-red-700",
  disputed: "bg-orange-50 text-orange-800",
};

function OrderCardStatusPill({
  status,
  label,
}: {
  status: OrderStatus;
  label: string;
}) {
  const className =
    statusPillStyles[status] ?? "bg-gray-100 text-gray-600";

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${className}`}
    >
      {label}
    </span>
  );
}

function actionBanner(
  status: OrderStatus,
  role: UserRole,
  t: TFunction<"orders">,
): { title: string; body: string } | null {
  if (role === "customer") {
    if (status === "pending_payment") {
      return {
        title: t("card.bannerPayTitle"),
        body: t("card.bannerPayBody"),
      };
    }
    if (status === "pending_customer_confirmation") {
      return {
        title: t("card.bannerConfirmTitle"),
        body: t("card.bannerConfirmBody"),
      };
    }
    if (status === "reviewed") {
      return {
        title: t("card.bannerReviewedTitle"),
        body: t("card.bannerReviewedBody"),
      };
    }
  }
  if (role === "provider") {
    if (status === "pending_provider_acceptance") {
      return {
        title: t("card.bannerNewTitle"),
        body: t("card.bannerNewBody"),
      };
    }
    if (status === "in_progress") {
      return {
        title: t("card.bannerProgressTitle"),
        body: t("card.bannerProgressBody"),
      };
    }
  }
  return null;
}

function ordersLocale(lang: string): string {
  if (lang === "ru") return "ru-RU";
  if (lang === "kk") return "kk-KZ";
  return "en-US";
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M2.5 4.5h11v7h-11v-7z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 6.5h8.5a2 2 0 012 2v0a2 2 0 01-2 2H2.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="11" cy="8" r="0.75" fill="currentColor" />
    </svg>
  );
}

export default function OrderCard({
  order,
  serviceTitle,
  role,
  counterpartyName,
  counterpartyAvatarUrl,
  onAction,
  onPaymentSuccess,
}: OrderCardProps) {
  const { openModal } = useModalStore();
  const { t, statusLabel, i18n } = useOrdersTranslation();
  const actions = getActions(order.status, role, t);
  const banner = actionBanner(order.status, role, t);

  const title =
    serviceTitle ?? t("list.serviceFallback", { id: order.service_id });

  const openPaymentModal = useCallback(() => {
    openModal(
      <OrderPaymentModal
        order={order}
        orderTitle={title}
        onSuccess={onPaymentSuccess}
      />,
    );
  }, [openModal, order, title, onPaymentSuccess]);

  const scheduledDate = useMemo(
    () =>
      new Date(order.scheduled_at).toLocaleDateString(
        ordersLocale(i18n.language),
        { year: "numeric", month: "short", day: "numeric" },
      ),
    [order.scheduled_at, i18n.language],
  );

  const displayName =
    counterpartyName?.trim() ||
    (role === "customer"
      ? t("list.providerFallback", { id: order.provider_id })
      : t("list.customerFallback", { id: order.customer_id }));

  const initials = (() => {
    const alnum = displayName.replace(/[^a-zA-Zа-яА-ЯЁё0-9]/g, "");
    if (alnum.length >= 2) return alnum.slice(0, 2).toUpperCase();
    if (alnum.length === 1) return alnum.toUpperCase();
    return "?";
  })();

  const chatHref = `/chat?providerId=${order.provider_id}&serviceId=${order.service_id}`;
  const detailHref = `/orders/${order.id}`;

  return (
    <div className="bg-white border border-gray-100/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex gap-4 sm:gap-5">
        <Link
          href={detailHref}
          className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full overflow-hidden ring-2 ring-white shadow-md bg-[#486284]/10"
        >
          {counterpartyAvatarUrl ? (
            <Image
              src={counterpartyAvatarUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-sm sm:text-base font-bold text-[#486284]">
              {initials.length <= 2 ? initials : initials.slice(0, 2)}
            </span>
          )}
        </Link>

        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:gap-6">
            <div className="min-w-0">
              <Link href={detailHref}>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug hover:text-[#486284] transition-colors line-clamp-2">
                  {title}
                </h3>
              </Link>
              <p className="text-sm text-gray-500 mt-1.5">
                <span className="text-gray-400">{t("card.by")}</span>{" "}
                <span className="font-medium text-gray-700">{displayName}</span>
                <span className="text-gray-300 mx-2">•</span>
                <span className="text-gray-500">
                  {t("card.scheduled", { date: scheduledDate })}
                </span>
              </p>
            </div>

            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2 shrink-0 lg:text-right">
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums tracking-tight">
                {formatCurrency(order.agreed_price, { decimals: 2 })}
              </p>
              <OrderCardStatusPill
                status={order.status}
                label={statusLabel(order.status)}
              />
            </div>
          </div>

          {banner ? (
            <div className="rounded-xl border border-[#486284]/10 bg-slate-100/90 px-4 py-3.5 flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-[#486284]/15 text-[#486284] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle
                    cx="8"
                    cy="8"
                    r="6.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <path
                    d="M8 7.2V11M8 5.3h.01"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">{banner.title}</p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                  {banner.body}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <Link
                href={chatHref}
                className="inline-flex items-center gap-2 font-semibold text-gray-600 hover:text-[#486284] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M0 20V2C0 1.45.196.979.588.588A1.93 1.93 0 012 0h16c.55 0 1.021.196 1.413.588.391.391.587.862.587 1.412v12c0 .55-.196 1.021-.587 1.413A1.93 1.93 0 0118 16H4L0 20z"
                    fill="currentColor"
                    className="opacity-70"
                  />
                </svg>
                {t("card.openChat")}
              </Link>
              <Link
                href={detailHref}
                className="font-medium text-gray-500 hover:text-gray-800 transition-colors"
              >
                {t("card.viewDetails")}
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {role === "customer" && order.status === "reviewed" ? (
                <span className="inline-flex min-h-[44px] items-center px-4 rounded-xl text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200">
                  {t("card.reviewAlreadyLeft")}
                </span>
              ) : null}
              {actions.map((act) => (
                <button
                  key={act.action}
                  type="button"
                  onClick={() => {
                    if (act.action === "pay") {
                      openPaymentModal();
                      return;
                    }
                    onAction(order.id, act.action);
                  }}
                  className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl text-sm font-semibold transition-colors ${
                    act.primary
                      ? "bg-[#486284] hover:bg-[#3a5270] text-white shadow-sm"
                      : act.action === "reject"
                        ? "bg-white border border-red-200 text-red-600 hover:bg-red-50"
                        : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {act.icon === "wallet" ? (
                    <WalletIcon className="opacity-90" />
                  ) : null}
                  {act.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
