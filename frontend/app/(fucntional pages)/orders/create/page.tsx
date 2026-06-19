"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import OrderSummary from "@/components/orders/OrderSummary";
import OrderServicePreview from "@/components/orders/OrderServicePreview";
import LocationMap, { type MapResolvedPlace } from "@/components/common/Map";
import {
  servicesApi,
  ordersApi,
  reviewsApi,
  authApi,
  mediaApi,
  ApiError,
  type Service,
  type User,
} from "@/lib/api";
import PhotoUploadField from "@/components/common/PhotoUploadField";
import { useOrdersTranslation } from "@/lib/i18n/useOrdersTranslation";

/** Builds RFC3339 with local timezone offset, e.g. 2026-03-26T20:30:00+05:00 */
function localDateTimeInputToRFC3339(value: string): string {
  if (!value || !value.includes("T")) return "";
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const local = new Date(y, m - 1, d, hh, mm, 0, 0);
  const tzo = -local.getTimezoneOffset();
  const sign = tzo >= 0 ? "+" : "-";
  const abs = Math.abs(tzo);
  const oh = pad(Math.floor(abs / 60));
  const om = pad(abs % 60);
  return `${datePart}T${pad(hh)}:${pad(mm)}:00${sign}${oh}:${om}`;
}

interface FormData {
  service_id: string;
  provider_id: string;
  agreed_price: string;
  city: string;
  region: string;
  street: string;
  latitude: string;
  longitude: string;
  scheduled_local: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle
              cx="8"
              cy="8"
              r="7"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8 5v3m0 2.5h.005"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

function CreateOrderContent() {
  const { t } = useOrdersTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultServiceId = searchParams.get("serviceId") ?? "1";
  const defaultProviderId = searchParams.get("providerId") ?? "";

  const [service, setService] = useState<Service | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [serviceReviews, setServiceReviews] = useState({
    avg: 0,
    count: 0,
  });
  const [providerReviews, setProviderReviews] = useState({
    avg: 0,
    count: 0,
  });
  const [providerProfile, setProviderProfile] = useState<User | null>(null);
  const [orderPhotos, setOrderPhotos] = useState<File[]>([]);

  const [form, setForm] = useState<FormData>({
    service_id: defaultServiceId,
    provider_id: defaultProviderId,
    agreed_price: "",
    city: "",
    region: "",
    street: "",
    latitude: "",
    longitude: "",
    scheduled_local: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const serviceIdNum = Number(form.service_id);
  useEffect(() => {
    if (!serviceIdNum || Number.isNaN(serviceIdNum) || serviceIdNum <= 0) {
      setService(null);
      setServiceReviews({ avg: 0, count: 0 });
      setProviderReviews({ avg: 0, count: 0 });
      setProviderProfile(null);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);

    (async () => {
      try {
        const svcRes = await servicesApi
          .getService(serviceIdNum, { auth: true })
          .catch(() => servicesApi.getService(serviceIdNum));
        if (cancelled) return;
        setService(svcRes.service);

        const svcRev = await reviewsApi
          .getReviewsByService(serviceIdNum)
          .catch(() => ({ reviews: [] as { rating: number }[], avgRating: 0 }));
        if (cancelled) return;
        setServiceReviews({
          avg: svcRev.avgRating,
          count: svcRev.reviews.length,
        });

        const pidRaw =
          form.provider_id.trim() || svcRes.service.providerId?.trim() || "";
        const pidNum = Number(pidRaw);
        if (pidRaw && Number.isFinite(pidNum) && pidNum > 0) {
          const [pRev, pInfo] = await Promise.all([
            reviewsApi
              .getReviewsByProvider(pidNum)
              .catch(() => ({
                reviews: [] as { rating: number }[],
                avgRating: 0,
              })),
            authApi.getProviderInfo(String(pidNum)).catch(() => null),
          ]);
          if (cancelled) return;
          setProviderReviews({
            avg: pRev.avgRating,
            count: pRev.reviews.length,
          });
          setProviderProfile(pInfo?.user ?? null);
        } else {
          if (!cancelled) {
            setProviderReviews({ avg: 0, count: 0 });
            setProviderProfile(null);
          }
        }
      } catch {
        if (!cancelled) {
          setService(null);
          setServiceReviews({ avg: 0, count: 0 });
          setProviderReviews({ avg: 0, count: 0 });
          setProviderProfile(null);
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [serviceIdNum, form.provider_id]);

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setApiError(null);
  }, []);

  const applyMapLocation = useCallback((p: MapResolvedPlace) => {
    setForm((prev) => ({
      ...prev,
      street: p.street,
      city: p.city,
      region: p.region,
      latitude: String(p.latitude),
      longitude: String(p.longitude),
    }));
    setErrors((e) => {
      const next = { ...e };
      delete next.street;
      delete next.city;
      delete next.region;
      return next;
    });
    setApiError(null);
  }, []);

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!form.service_id.trim()) {
      next.service_id = t("create.errServiceId");
    } else if (Number.isNaN(serviceIdNum) || serviceIdNum <= 0) {
      next.service_id = t("create.errServiceIdNum");
    }

    if (!form.provider_id.trim()) {
      next.provider_id = t("create.errProviderId");
    } else {
      const pid = Number(form.provider_id);
      if (Number.isNaN(pid) || pid <= 0) {
        next.provider_id = t("create.errProviderIdNum");
      }
    }

    if (!form.street.trim()) next.street = t("create.errStreet");
    if (!form.city.trim()) next.city = t("create.errCity");
    if (!form.region.trim()) next.region = t("create.errRegion");

    // if (!form.latitude.trim()) {
    //   next.latitude = "Latitude is required";
    // } else {
    //   const lat = Number(form.latitude);
    //   if (Number.isNaN(lat)) next.latitude = "Must be a valid number";
    // }

    // if (!form.longitude.trim()) {
    //   next.longitude = "Longitude is required";
    // } else {
    //   const lng = Number(form.longitude);
    //   if (Number.isNaN(lng)) next.longitude = "Must be a valid number";
    // }

    if (!form.scheduled_local) {
      next.scheduled_local = t("create.errScheduled");
    }

    if (!form.agreed_price.trim()) {
      next.agreed_price = t("create.errPrice");
    } else {
      const num = parseFloat(form.agreed_price);
      if (Number.isNaN(num) || num <= 0) {
        next.agreed_price = t("create.errPriceNum");
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setApiError(null);

    const scheduledAt = localDateTimeInputToRFC3339(form.scheduled_local);
    if (!scheduledAt) {
      setErrors((e) => ({
        ...e,
        scheduled_local: t("create.errInvalidDateTime"),
      }));
      setSubmitting(false);
      return;
    }

    try {
      let photo_urls: string[] | undefined;
      if (orderPhotos.length > 0) {
        photo_urls = (
          await mediaApi.uploadBatch(orderPhotos, mediaApi.ORDER_PHOTOS_CONTEXT)
        ).map((item) => item.url);
      }

      const order = await ordersApi.createOrder({
        agreed_price: parseFloat(form.agreed_price),
        city: form.city.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        provider_id: Number(form.provider_id),
        region: form.region.trim(),
        scheduled_at: scheduledAt,
        service_id: serviceIdNum,
        street: form.street.trim(),
        ...(photo_urls?.length ? { photo_urls } : {}),
      });

      router.push(`/orders/${order.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(
          err.body.message ?? err.body.error ?? t("create.createFailed"),
        );
      } else {
        setApiError(
          err instanceof Error ? err.message : t("create.createFailedRetry"),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const shortAddress = [form.street, form.city]
    .filter((s) => s.trim())
    .join(", ");
  const [summaryDate, summaryTime] = form.scheduled_local.includes("T")
    ? form.scheduled_local.split("T")
    : ["", ""];

  const inputClass = (hasError: boolean) =>
    `w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors outline-none ${
      hasError
        ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-gray-200 bg-white focus:border-[#486284] focus:ring-2 focus:ring-[#486284]/15"
    }`;

  const resolvedServiceId = useMemo(() => {
    if (serviceIdNum > 0 && !Number.isNaN(serviceIdNum)) return serviceIdNum;
    const n = Number(form.service_id);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  }, [serviceIdNum, form.service_id]);

  const effectiveProviderId = useMemo(() => {
    const f = form.provider_id.trim();
    if (f) return f;
    return service?.providerId?.trim() ?? "";
  }, [form.provider_id, service?.providerId]);

  const serviceTitle =
    service?.title ??
    t("create.serviceFallback", { id: form.service_id || "?" });

  const providerFallbackLabel = useMemo(() => {
    const id = effectiveProviderId || form.provider_id.trim();
    return id ? t("create.providerFallback", { id }) : t("create.provider");
  }, [effectiveProviderId, form.provider_id, t]);

  const servicePreview = useMemo(
    () => ({
      serviceId: resolvedServiceId,
      title: serviceTitle,
      coverUrl: service?.photoUrls?.[0],
      serviceAvgRating: serviceReviews.avg,
      serviceReviewCount: serviceReviews.count,
      loading: previewLoading,
    }),
    [
      resolvedServiceId,
      serviceTitle,
      service?.photoUrls,
      serviceReviews.avg,
      serviceReviews.count,
      previewLoading,
    ],
  );

  const providerPreview = useMemo(
    () => ({
      providerId: effectiveProviderId || undefined,
      providerFallbackLabel,
      providerFirstName:
        providerProfile?.firstName ?? service?.provider?.firstName,
      providerSecondName:
        providerProfile?.secondName ?? service?.provider?.secondName,
      providerAvatarUrl:
        providerProfile?.avatarUrl ?? service?.provider?.avatarUrl,
      providerAvgRating: providerReviews.avg,
      providerReviewCount: providerReviews.count,
      loading: previewLoading,
    }),
    [
      effectiveProviderId,
      providerFallbackLabel,
      providerProfile?.firstName,
      providerProfile?.secondName,
      providerProfile?.avatarUrl,
      service?.provider?.firstName,
      service?.provider?.secondName,
      service?.provider?.avatarUrl,
      providerReviews.avg,
      providerReviews.count,
      previewLoading,
    ],
  );

  const serviceIdForLink = resolvedServiceId;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <Link
        href={`/dashboard/${serviceIdForLink}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
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
        {t("create.backToService")}
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("create.title")}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">{t("create.subtitle")}</p>
      </div>

      <div className="flex gap-8">
        <div className="flex-1 min-w-0 space-y-6">
          <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
            <OrderServicePreview {...servicePreview} compact={false} />
          </div>

          <div className="flex gap-3 p-4 bg-[#486284]/5 border border-[#486284]/15 rounded-xl">
            <div className="w-5 h-5 rounded-full bg-[#486284] flex items-center justify-center shrink-0 mt-0.5">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 5v4m0 2.5h.005"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="text-sm text-[#486284] leading-relaxed">
              {t("create.chatHint")}
            </p>
          </div>

          {apiError && (
            <div className="flex gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0 mt-0.5 text-red-500"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 8v4m0 4h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          )}

          <fieldset
            disabled={submitting}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4"
          >
            <legend className="text-base font-semibold text-gray-900 px-1">
              {t("create.location")}
            </legend>
            <FormField
              label={t("create.street")}
              required
              error={errors.street}
            >
              <input
                type="text"
                placeholder="mangilik el"
                value={form.street}
                onChange={(e) => updateField("street", e.target.value)}
                className={inputClass(!!errors.street)}
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t("create.city")} required error={errors.city}>
                <input
                  type="text"
                  placeholder="astana"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className={inputClass(!!errors.city)}
                />
              </FormField>
              <FormField
                label={t("create.region")}
                required
                error={errors.region}
              >
                <input
                  type="text"
                  placeholder="astana akmola"
                  value={form.region}
                  onChange={(e) => updateField("region", e.target.value)}
                  className={inputClass(!!errors.region)}
                />
              </FormField>
            </div>
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="latitude" required error={errors.latitude}>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="-69877378.08014858"
                  value={form.latitude}
                  onChange={(e) => updateField("latitude", e.target.value)}
                  className={inputClass(!!errors.latitude)}
                />
              </FormField>
              <FormField label="longitude" required error={errors.longitude}>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="61950969.505081594"
                  value={form.longitude}
                  onChange={(e) => updateField("longitude", e.target.value)}
                  className={inputClass(!!errors.longitude)}
                />
              </FormField>
            </div> */}
            <LocationMap onPlaceResolved={applyMapLocation} />
          </fieldset>

          <fieldset
            disabled={submitting}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4"
          >
            <legend className="text-base font-semibold text-gray-900 px-1">
              {t("create.scheduledTime")}
            </legend>
            <FormField
              label={t("create.dateTimeLocal")}
              required
              error={errors.scheduled_local}
            >
              <input
                type="datetime-local"
                value={form.scheduled_local}
                onChange={(e) => updateField("scheduled_local", e.target.value)}
                className={inputClass(!!errors.scheduled_local)}
              />
            </FormField>
          </fieldset>

          <fieldset
            disabled={submitting}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4"
          >
            <legend className="text-base font-semibold text-gray-900 px-1">
              {t("create.price")}
            </legend>
            <FormField
              label={t("create.agreedPrice")}
              required
              error={errors.agreed_price}
            >
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="3132"
                  value={form.agreed_price}
                  onChange={(e) => updateField("agreed_price", e.target.value)}
                  className={`${inputClass(!!errors.agreed_price)} pr-10`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                  ₸
                </span>
              </div>
            </FormField>
          </fieldset>

          <fieldset
            disabled={submitting}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
          >
            <PhotoUploadField
              label={t("create.orderPhotos")}
              hint={t("create.orderPhotosHint")}
              files={orderPhotos}
              onFilesChange={setOrderPhotos}
              disabled={submitting}
            />
          </fieldset>

          <div className="lg:hidden pb-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 px-4 bg-[#486284] hover:bg-[#3a5270] disabled:bg-[#486284]/40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {t("create.creating")}
                </>
              ) : (
                t("create.createOrder")
              )}
            </button>
          </div>
        </div>

        <div className="w-[340px] shrink-0 hidden lg:block">
          <OrderSummary
            provider={providerPreview}
            date={summaryDate}
            time={summaryTime}
            address={shortAddress}
            price={form.agreed_price}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}

export default function CreateOrderPage() {
  return (
    <Suspense>
      <CreateOrderContent />
    </Suspense>
  );
}
