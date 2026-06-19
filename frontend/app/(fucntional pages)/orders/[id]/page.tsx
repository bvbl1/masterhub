"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/orders/StatusBadge";
import OrderTimeline from "@/components/orders/OrderTimeline";
import OrderStatusPanel from "@/components/orders/OrderStatusPanel";
import OrderPaymentModal from "@/components/orders/OrderPaymentModal";
import OrderDetailsSkeleton from "@/components/orders/OrderDetailsSkeleton";
import OrderServicePreview from "@/components/orders/OrderServicePreview";
import OrderProviderPreview from "@/components/orders/OrderProviderPreview";
import OrderCustomerPreview from "@/components/orders/OrderCustomerPreview";
import { useAuth } from "@/lib/context/AuthContext";
import {
  ordersApi,
  servicesApi,
  locationsApi,
  authApi,
  reviewsApi,
  mediaApi,
  type Order,
  type Service,
  type Location,
  type User,
} from "@/lib/api";
import PhotoGallery from "@/components/common/PhotoGallery";
import PhotoUploadField from "@/components/common/PhotoUploadField";
import { formatCurrency } from "@/lib/formatCurrency";
import { useOrdersTranslation } from "@/lib/i18n/useOrdersTranslation";
import { useModalStore } from "@/lib/store/modalStore";

function ordersLocale(lang: string): string {
  if (lang === "ru") return "ru-RU";
  if (lang === "kk") return "kk-KZ";
  return "en-US";
}

/** API может отдать координаты строкой или пропустить поле. */
function parseFiniteCoord(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function DetailTile({
  label,
  children,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-linear-to-b from-gray-50/80 to-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="shrink-0 w-9 h-9 rounded-lg bg-[#486284]/10 text-[#486284] flex items-center justify-center">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
            {label}
          </p>
          <div className="text-sm text-gray-900 font-medium leading-snug">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useOrdersTranslation();
  return (
    <div className="min-h-[50vh] flex justify-center px-6 py-24">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-50 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2" />
            <path
              d="M12 8V12M12 16H12.01"
              stroke="#EF4444"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t("detail.errorTitle")}
        </h2>
        <p className="text-gray-500 mb-6">{t("detail.errorBody")}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-6 py-2.5 bg-[#486284] hover:bg-[#3a5270] text-white font-medium rounded-lg transition-colors text-sm"
        >
          {t("detail.tryAgain")}
        </button>
      </div>
    </div>
  );
}

function InvalidOrderState() {
  const { t } = useOrdersTranslation();
  return (
    <div className="min-h-[40vh] flex justify-center px-6 py-24">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t("detail.invalidTitle")}
        </h2>
        <p className="text-gray-500 mb-6 text-sm">{t("detail.invalidBody")}</p>
        <Link
          href="/orders"
          className="inline-flex px-6 py-2.5 bg-[#486284] hover:bg-[#3a5270] text-white font-medium rounded-lg transition-colors text-sm"
        >
          {t("detail.backToOrders")}
        </Link>
      </div>
    </div>
  );
}

export default function OrderDetailsPage() {
  const { t, i18n } = useOrdersTranslation();
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const locale = ordersLocale(i18n.language);
  const orderId = Number(params.id);
  const invalidId = !Number.isFinite(orderId) || orderId <= 0;

  const [order, setOrder] = useState<Order | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [providerProfile, setProviderProfile] = useState<User | null>(null);
  const [customerProfile, setCustomerProfile] = useState<User | null>(null);
  const [serviceReviews, setServiceReviews] = useState({
    avg: 0,
    count: 0,
  });
  const [providerReviews, setProviderReviews] = useState({
    avg: 0,
    count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputePhotos, setDisputePhotos] = useState<File[]>([]);
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeError, setDisputeError] = useState("");

  const role = user?.role ?? "customer";
  const { openModal } = useModalStore();

  const loadOrder = useCallback(async () => {
    if (invalidId) {
      setOrder(null);
      setError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const ord = await ordersApi.getOrder(orderId);
      setOrder(ord);

      const svcRes = await servicesApi
        .getService(ord.service_id, { auth: true })
        .catch(() => servicesApi.getService(ord.service_id))
        .catch(() => null);

      const [loc, provRes, custRes, svcRev, provRev] = await Promise.all([
        locationsApi.getLocation(ord.address_id).catch(() => null),
        authApi.getProviderInfo(String(ord.provider_id)).catch(() => null),
        authApi.getUserById(String(ord.customer_id)).catch(() => null),
        reviewsApi.getReviewsByService(ord.service_id).catch(() => ({
          reviews: [] as { rating: number }[],
          avgRating: 0,
        })),
        reviewsApi.getReviewsByProvider(ord.provider_id).catch(() => ({
          reviews: [] as { rating: number }[],
          avgRating: 0,
        })),
      ]);

      setService(svcRes?.service ?? null);
      setLocation(loc);
      setProviderProfile(provRes?.user ?? null);
      setCustomerProfile(custRes?.user ?? null);
      setServiceReviews({
        avg: svcRev.avgRating,
        count: svcRev.reviews.length,
      });
      setProviderReviews({
        avg: provRev.avgRating,
        count: provRev.reviews.length,
      });
    } catch {
      setError(true);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, invalidId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const openPaymentModal = useCallback(() => {
    if (!order) return;
    const title =
      service?.title ??
      t("detail.serviceFallback", { id: order.service_id });
    openModal(
      <OrderPaymentModal
        order={order}
        orderTitle={title}
        onSuccess={loadOrder}
      />,
    );
  }, [order, service?.title, t, openModal, loadOrder]);

  const handleAction = async (action: string) => {
    if (!order) return;

    if (action === "pay") {
      openPaymentModal();
      return;
    }

    if (action === "dispute") {
      setDisputeError("");
      setDisputeReason("");
      setDisputePhotos([]);
      setDisputeOpen(true);
      return;
    }

    if (action === "open_chat") {
      if (role === "provider") {
        router.push(
          `/chat?customerId=${order.customer_id}&providerId=${order.provider_id}&serviceId=${order.service_id}`,
        );
      } else {
        router.push(
          `/chat?providerId=${order.provider_id}&serviceId=${order.service_id}`,
        );
      }
      return;
    }
    if (action === "review") {
      router.push(`/orders/${order.id}?review=true`);
      return;
    }

    try {
      switch (action) {
        case "accept":
          await ordersApi.acceptOrder(order.id);
          break;
        case "reject":
          await ordersApi.rejectOrder(order.id, {
            reason: "Rejected by provider",
          });
          break;
        case "complete":
          await ordersApi.completeOrder(order.id);
          break;
        case "confirm":
          await ordersApi.confirmOrder(order.id);
          break;
        case "cancel":
          await ordersApi.cancelOrder(order.id);
          break;
      }
      await loadOrder();
    } catch (err) {
      console.error(`Action "${action}" failed:`, err);
    }
  };

  const submitDispute = useCallback(async () => {
    if (!order) return;
    const reason = disputeReason.trim();
    if (reason.length < 10) {
      setDisputeError(t("detail.disputeMinLength"));
      return;
    }
    setDisputeSubmitting(true);
    setDisputeError("");
    try {
      let photo_urls: string[] | undefined;
      if (disputePhotos.length > 0) {
        photo_urls = (
          await mediaApi.uploadBatch(
            disputePhotos,
            mediaApi.DISPUTE_PHOTOS_CONTEXT,
          )
        ).map((item) => item.url);
      }
      await ordersApi.disputeOrder(order.id, {
        reason,
        ...(photo_urls?.length ? { photo_urls } : {}),
      });
      setDisputeOpen(false);
      setDisputeReason("");
      setDisputePhotos([]);
      await loadOrder();
    } catch {
      setDisputeError(t("detail.disputeFailed"));
    } finally {
      setDisputeSubmitting(false);
    }
  }, [order, disputeReason, disputePhotos, loadOrder, t]);

  const servicePreviewProps = useMemo(() => {
    if (!order) return null;
    return {
      serviceId: order.service_id,
      title:
        service?.title ??
        t("detail.serviceFallback", { id: order.service_id }),
      coverUrl: service?.photoUrls?.[0],
      serviceAvgRating: serviceReviews.avg,
      serviceReviewCount: serviceReviews.count,
      loading: false,
    };
  }, [order, service, serviceReviews, t]);

  const providerPreviewProps = useMemo(() => {
    if (!order) return null;
    return {
      providerId: String(order.provider_id),
      providerFallbackLabel: t("detail.providerFallback", {
        id: order.provider_id,
      }),
      providerFirstName:
        providerProfile?.firstName ?? service?.provider?.firstName,
      providerSecondName:
        providerProfile?.secondName ?? service?.provider?.secondName,
      providerAvatarUrl:
        providerProfile?.avatarUrl ?? service?.provider?.avatarUrl,
      providerAvgRating: providerReviews.avg,
      providerReviewCount: providerReviews.count,
      loading: false,
    };
  }, [order, providerProfile, service, providerReviews, t]);

  const customerPreviewProps = useMemo(() => {
    if (!order) return null;
    return {
      customerId: order.customer_id,
      customerFallbackLabel: t("list.customerFallback", {
        id: order.customer_id,
      }),
      customerFirstName: customerProfile?.firstName,
      customerSecondName: customerProfile?.secondName,
      customerAvatarUrl: customerProfile?.avatarUrl,
      customerEmail: customerProfile?.email,
      customerPhone: customerProfile?.phone,
      loading: false,
    };
  }, [order, customerProfile, t]);

  if (invalidId) {
    return (
      <div className="min-h-screen bg-slate-50/80">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
          <InvalidOrderState />
        </div>
      </div>
    );
  }

  if (loading) return <OrderDetailsSkeleton />;
  if (error || !order) return <ErrorState onRetry={loadOrder} />;

  const scheduledDate = new Date(order.scheduled_at).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const scheduledDateShort = new Date(order.scheduled_at).toLocaleDateString(
    locale,
    { weekday: "short", month: "short", day: "numeric" },
  );
  const scheduledTimeOnly = new Date(order.scheduled_at).toLocaleTimeString(
    locale,
    { hour: "2-digit", minute: "2-digit" },
  );

  const addressLines = location
    ? [
        location.street,
        [location.city, location.region].filter(Boolean).join(", "),
      ]
        .map((s) => (s == null ? "" : String(s).trim()))
        .filter(Boolean)
    : [];

  const addressText = addressLines.length
    ? addressLines.join(" · ")
    : t("detail.locationFallback", { id: order.address_id });

  const latNum = location ? parseFiniteCoord(location.latitude) : null;
  const lngNum = location ? parseFiniteCoord(location.longitude) : null;
  const hasMapCoords = latNum !== null && lngNum !== null;

  const mapsExternalUrl =
    hasMapCoords && latNum !== null && lngNum !== null
      ? `https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`
      : null;

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100/90 via-slate-50/50 to-white pb-28 lg:pb-10">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#486284] transition-colors w-fit"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("detail.backToOrders")}
          </Link>
        </div>

        {/* Hero */}
        <header className="relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm mb-8">
          <div className="absolute inset-0 bg-linear-to-br from-[#486284]/12 via-transparent to-transparent pointer-events-none" />
          <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#486284] mb-2">
                {t("detail.orderLabel")}
              </p>

              <p className="text-sm text-gray-500 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1.5">
                  <svg
                    className="text-gray-400 shrink-0"
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M12.667 2.667H3.333C2.597 2.667 2 3.263 2 4v9.333c0 .737.597 1.334 1.333 1.334h9.334c.736 0 1.333-.597 1.333-1.334V4c0-.737-.597-1.333-1.333-1.333z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M10.667 1.333V4M5.333 1.333V4M2 6.667h12"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {scheduledDateShort}
                  <span className="text-gray-300">·</span>
                  {scheduledTimeOnly}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl bg-gray-50/80 px-4 py-3 min-w-[140px]">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                  {t("detail.agreedPrice")}
                </p>
                <p className="text-xl font-bold text-gray-900 tabular-nums">
                  {formatCurrency(order.agreed_price, { decimals: 2 })}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <div className="flex-1 min-w-0 space-y-6">
            {/* Service */}
            {servicePreviewProps ? (
              <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                  {t("detail.service")}
                </h2>
                <OrderServicePreview {...servicePreviewProps} compact={false} />
              </section>
            ) : null}

            {/* Other party: provider (customer view) or customer (provider view) */}
            {role === "customer" && providerPreviewProps ? (
              <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                  {t("detail.provider")}
                </h2>
                <OrderProviderPreview
                  {...providerPreviewProps}
                  compact={false}
                />
                <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-3">
                  {t("detail.yourCustomerId")}{" "}
                  <span className="font-mono text-gray-600">
                    #{order.customer_id}
                  </span>
                </p>
              </section>
            ) : role === "provider" && customerPreviewProps ? (
              <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                  {t("detail.customer")}
                </h2>
                <OrderCustomerPreview
                  {...customerPreviewProps}
                  compact={false}
                />
                <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                  {t("detail.customerChatHint")}
                </p>
                <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-3">
                  {t("detail.orderProviderYou")}{" "}
                  <span className="font-mono text-gray-600">
                    #{order.provider_id}
                  </span>
                </p>
              </section>
            ) : (
              <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                  {t("detail.participants")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-100 bg-slate-50/60 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                      {t("detail.provider")}
                    </p>
                    <p className="font-mono font-semibold text-gray-900">
                      #{order.provider_id}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-slate-50/60 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                      {t("detail.customer")}
                    </p>
                    <p className="font-mono font-semibold text-gray-900">
                      #{order.customer_id}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Order meta */}
            <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                {t("detail.orderDetails")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailTile
                  label={t("detail.orderId")}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 3h10v10H3V3z"
                        stroke="currentColor"
                        strokeWidth="1.3"
                      />
                      <path
                        d="M5 6h6M5 9h4"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                    </svg>
                  }
                >
                  <span className="font-mono tabular-nums">#{order.id}</span>
                </DetailTile>
                <DetailTile
                  label={t("detail.status")}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle
                        cx="8"
                        cy="8"
                        r="5.5"
                        stroke="currentColor"
                        strokeWidth="1.3"
                      />
                      <path
                        d="M8 5.2v2.8l1.8 1"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                    </svg>
                  }
                >
                  <StatusBadge status={order.status} />
                </DetailTile>
                <DetailTile
                  label={t("detail.scheduled")}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 6h10v7a1 1 0 01-1 1H4a1 1 0 01-1-1V6z"
                        stroke="currentColor"
                        strokeWidth="1.3"
                      />
                      <path
                        d="M3 6V4a1 1 0 011-1h1m6 0h1a1 1 0 011 1v2M6 3v2m4-2v2"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                    </svg>
                  }
                >
                  {scheduledDate}
                </DetailTile>
                <DetailTile
                  label={t("detail.serviceId")}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 12l4-8 3 4 3-4 3 8H3z"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                >
                  <Link
                    href={`/dashboard/${order.service_id}`}
                    className="text-[#486284] hover:underline font-semibold"
                  >
                    #{order.service_id}
                  </Link>
                </DetailTile>
              </div>
            </section>

            {/* Address + map */}
            <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {t("detail.serviceLocation")}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {t("detail.locationSubtitle")}
                  </p>
                </div>
                {mapsExternalUrl ? (
                  <a
                    href={mapsExternalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#486284] hover:underline shrink-0"
                  >
                    {t("detail.openGoogleMaps")}
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M6 3h7v7M13 3L5 11"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </a>
                ) : null}
              </div>

              <div className="flex items-start gap-3 mb-4 rounded-xl bg-slate-50 border border-slate-100 p-4">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="shrink-0 text-[#486284] mt-0.5"
                >
                  <path
                    d="M14 6.667C14 11.333 8 15.333 8 15.333S2 11.333 2 6.667a6 6 0 1112 0z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="8"
                    cy="6.667"
                    r="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 leading-relaxed font-medium">
                    {addressText}
                  </p>
                  {hasMapCoords && latNum != null && lngNum != null ? (
                    <p className="text-xs text-gray-400 mt-2 font-mono tabular-nums">
                      {latNum.toFixed(5)}, {lngNum.toFixed(5)}
                    </p>
                  ) : null}
                </div>
              </div>

              {hasMapCoords && latNum !== null && lngNum !== null ? (
                <div className="rounded-xl overflow-hidden border border-gray-200 shadow-inner bg-gray-100">
                  <iframe
                    title={t("detail.mapTitle")}
                    className="w-full h-[220px] sm:h-[280px]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps?q=${latNum},${lngNum}&z=15&output=embed`}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 h-44 flex flex-col items-center justify-center text-center px-4">
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-gray-300 mb-2"
                  >
                    <path
                      d="M12 22s8-4.5 8-11a8 8 0 10-16 0c0 6.5 8 11 8 11z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="12"
                      cy="11"
                      r="2.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <p className="text-sm text-gray-500">
                    {t("detail.noMapCoords")}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t("detail.noMapCoordsHint")}
                  </p>
                </div>
              )}
            </section>

            {order.photoUrls && order.photoUrls.length > 0 ? (
              <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-3">
                  {t("detail.orderPhotos")}
                </h2>
                <PhotoGallery urls={order.photoUrls} size="lg" />
              </section>
            ) : null}

            {/* Timeline */}
            <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-1">
                {t("detail.progress")}
              </h2>
              <p className="text-xs text-gray-400 mb-5">
                {t("detail.progressHint")}
              </p>
              <OrderTimeline status={order.status} />
            </section>

            {/* Communication */}
            <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm mb-2">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#486284]" />
              <div className="p-5 sm:p-6 pl-6 sm:pl-7">
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  {t("detail.communication")}
                </h2>
                <p className="text-sm text-gray-500 mb-5 max-w-xl leading-relaxed">
                  {t("detail.communicationHint", {
                    party:
                      role === "customer"
                        ? t("detail.partyProvider")
                        : t("detail.partyCustomer"),
                  })}
                </p>
                <button
                  type="button"
                  onClick={() => handleAction("open_chat")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#486284] hover:bg-[#3a5270] text-white text-sm font-semibold transition-colors shadow-sm"
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M0 20V2C0 1.45.196.979.588.588A1.93 1.93 0 012 0h16c.55 0 1.021.196 1.413.588.391.391.587.862.587 1.412v12c0 .55-.196 1.021-.587 1.413A1.93 1.93 0 0118 16H4L0 20z"
                      fill="white"
                    />
                  </svg>
                  {t("actions.openChat")}
                </button>
              </div>
            </section>
          </div>

          <aside className="w-full lg:w-[340px] shrink-0 lg:sticky lg:top-20 lg:self-start">
            <OrderStatusPanel
              status={order.status}
              role={role}
              price={order.agreed_price}
              onAction={handleAction}
            />
          </aside>
        </div>
      </div>

      {disputeOpen && order ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dispute-dialog-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 p-6">
            <h2
              id="dispute-dialog-title"
              className="text-lg font-bold text-gray-900"
            >
              {t("detail.disputeTitle")}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t("detail.disputeHint")}
            </p>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={5}
              className="mt-4 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none focus:border-[#486284] focus:ring-2 focus:ring-[#486284]/20 resize-y min-h-[120px]"
              placeholder={t("detail.disputePlaceholder")}
              disabled={disputeSubmitting}
            />
            <div className="mt-4">
              <PhotoUploadField
                label={t("detail.disputeEvidence")}
                hint={t("detail.disputeEvidenceHint")}
                files={disputePhotos}
                onFilesChange={setDisputePhotos}
                disabled={disputeSubmitting}
                maxFiles={6}
              />
            </div>
            {disputeError ? (
              <p className="mt-2 text-sm text-red-600">{disputeError}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!disputeSubmitting) setDisputeOpen(false);
                }}
                disabled={disputeSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 disabled:opacity-50"
              >
                {t("list.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void submitDispute()}
                disabled={disputeSubmitting}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {disputeSubmitting
                  ? t("detail.submitting")
                  : t("detail.submitDispute")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Mobile sticky bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div className="min-w-0">
            <StatusBadge status={order.status} />
            <p className="text-sm font-bold text-gray-900 tabular-nums mt-1">
              {formatCurrency(order.agreed_price, { decimals: 2 })}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleAction("open_chat")}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-800 font-semibold rounded-xl text-sm shadow-sm"
            >
              {t("actions.chat")}
            </button>
            {role === "customer" && order.status === "pending_payment" && (
              <button
                type="button"
                onClick={() => handleAction("pay")}
                className="px-4 py-2.5 bg-[#486284] text-white font-semibold rounded-xl text-sm shadow-sm"
              >
                {t("actions.pay")}
              </button>
            )}
            {role === "customer" &&
              order.status === "pending_customer_confirmation" && (
                <button
                  type="button"
                  onClick={() => handleAction("confirm")}
                  className="px-4 py-2.5 bg-[#486284] text-white font-semibold rounded-xl text-sm shadow-sm"
                >
                  {t("actions.confirm")}
                </button>
              )}
            {role === "provider" &&
              order.status === "pending_provider_acceptance" && (
                <button
                  type="button"
                  onClick={() => handleAction("accept")}
                  className="px-4 py-2.5 bg-[#486284] text-white font-semibold rounded-xl text-sm shadow-sm"
                >
                  {t("actions.accept")}
                </button>
              )}
            {role === "provider" && order.status === "in_progress" && (
              <button
                type="button"
                onClick={() => handleAction("complete")}
                className="px-4 py-2.5 bg-[#486284] text-white font-semibold rounded-xl text-sm shadow-sm"
              >
                {t("actions.done")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
