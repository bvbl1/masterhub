"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ChangeEvent,
} from "react";
import OrderCard from "@/components/orders/OrderCard";
import OrdersSkeleton from "@/components/orders/OrdersSkeleton";
import { useAuth } from "@/lib/context/AuthContext";
import {
  ordersApi,
  reviewsApi,
  servicesApi,
  authApi,
  mediaApi,
  ApiError,
  type Order,
  type OrderStatus,
} from "@/lib/api";
import { HiOutlinePhotograph } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { useOrdersTranslation } from "@/lib/i18n/useOrdersTranslation";

const MAX_REVIEW_PHOTOS = 6;
const REVIEW_IMAGE_MAX_MB = 8;

type TabFilter = "all" | "active" | "completed" | "cancelled";

const activeStatuses: OrderStatus[] = [
  "pending_provider_acceptance",
  "pending_payment",
  "pending_customer_confirmation",
  "in_progress",
  "disputed",
];

function EmptyState({ tab }: { tab: TabFilter }) {
  const { t } = useOrdersTranslation();
  const emptyKeys: Record<TabFilter, { title: string; desc: string }> = {
    all: { title: "list.emptyAllTitle", desc: "list.emptyAllDesc" },
    active: { title: "list.emptyActiveTitle", desc: "list.emptyActiveDesc" },
    completed: {
      title: "list.emptyCompletedTitle",
      desc: "list.emptyCompletedDesc",
    },
    cancelled: {
      title: "list.emptyCancelledTitle",
      desc: "list.emptyCancelledDesc",
    },
  };
  const { title: titleKey, desc: descKey } = emptyKeys[tab];

  return (
    <div className="py-20 text-center">
      <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gray-50 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
            stroke="#D1D5DB"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="9"
            y="3"
            width="6"
            height="4"
            rx="1"
            stroke="#D1D5DB"
            strokeWidth="2"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{t(titleKey)}</h3>
      <p className="text-sm text-gray-400 max-w-sm mx-auto">{t(descKey)}</p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useOrdersTranslation();
  return (
    <div className="py-20 text-center">
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
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {t("list.errorTitle")}
      </h3>
      <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
        {t("list.errorDesc")}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-[#486284] hover:bg-[#3a5270] text-white font-medium rounded-lg transition-colors text-sm"
      >
        {t("list.tryAgain")}
      </button>
    </div>
  );
}

export default function OrdersPage() {
  const { t } = useOrdersTranslation();
  const { user } = useAuth();

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: t("list.tabAll") },
    { key: "active", label: t("list.tabActive") },
    { key: "completed", label: t("list.tabCompleted") },
    { key: "cancelled", label: t("list.tabCancelled") },
  ];
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceTitles, setServiceTitles] = useState<Record<number, string>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewPhotos, setReviewPhotos] = useState<File[]>([]);
  const [reviewPhotoPreviews, setReviewPhotoPreviews] = useState<string[]>([]);
  const [partyByUserId, setPartyByUserId] = useState<
    Record<number, { name: string; avatarUrl?: string }>
  >({});

  const role = user?.role ?? "customer";

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await ordersApi.getOrders();
      setOrders(data);

      const serviceIds = [...new Set(data.map((o) => o.service_id))];
      const titles: Record<number, string> = {};
      await Promise.all(
        serviceIds.map(async (id) => {
          try {
            const svc = await servicesApi.getService(id);
            titles[id] = svc.service.title;
          } catch {
            /* ignore */
          }
        }),
      );
      setServiceTitles(titles);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (reviewPhotos.length === 0) {
      setReviewPhotoPreviews([]);
      return;
    }
    const previews = reviewPhotos.map((image) => URL.createObjectURL(image));
    setReviewPhotoPreviews(previews);
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [reviewPhotos]);

  useEffect(() => {
    if (loading || orders.length === 0) return;
    let cancelled = false;
    const ids = new Set<number>();
    for (const o of orders) {
      if (role === "customer") ids.add(o.provider_id);
      else if (role === "provider") ids.add(o.customer_id);
      else {
        ids.add(o.provider_id);
        ids.add(o.customer_id);
      }
    }
    void (async () => {
      const next: Record<number, { name: string; avatarUrl?: string }> = {};
      await Promise.all(
        [...ids].map(async (id) => {
          try {
            const { user } = await authApi.getProviderInfo(String(id));
            const name =
              `${user.firstName} ${user.secondName}`.trim() ||
              t("list.userFallback", { id });
            next[id] = { name, avatarUrl: user.avatarUrl };
          } catch {
            next[id] = { name: t("list.userFallback", { id }) };
          }
        }),
      );
      if (!cancelled) {
        setPartyByUserId((prev) => ({ ...prev, ...next }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orders, loading, role, t]);

  const filteredOrders = useMemo(() => {
    switch (activeTab) {
      case "active":
        return orders.filter((o) => activeStatuses.includes(o.status));
      case "completed":
        return orders.filter(
          (o) => o.status === "completed" || o.status === "reviewed",
        );
      case "cancelled":
        return orders.filter(
          (o) =>
            o.status === "cancelled" || o.status === "rejected_by_provider",
        );
      default:
        return orders;
    }
  }, [orders, activeTab]);

  const tabCounts = useMemo(
    () => ({
      all: orders.length,
      active: orders.filter((o) => activeStatuses.includes(o.status)).length,
      completed: orders.filter(
        (o) => o.status === "completed" || o.status === "reviewed",
      ).length,
      cancelled: orders.filter(
        (o) => o.status === "cancelled" || o.status === "rejected_by_provider",
      ).length,
    }),
    [orders],
  );

  const closeReviewModal = () => {
    setReviewOrder(null);
    setReviewError(null);
    setReviewPhotos([]);
  };

  const submitReview = async () => {
    if (!reviewOrder) return;
    const comment = reviewComment.trim();
    if (!comment) {
      setReviewError(t("list.commentRequired"));
      return;
    }
    const maxBytes = REVIEW_IMAGE_MAX_MB * 1024 * 1024;
    for (const f of reviewPhotos) {
      if (f.size > maxBytes) {
        setReviewError(
          t("list.photoTooLarge", { name: f.name, mb: REVIEW_IMAGE_MAX_MB }),
        );
        return;
      }
    }
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      let photoUrls: string[] | undefined;
      if (reviewPhotos.length > 0) {
        photoUrls = (
          await mediaApi.uploadBatch(reviewPhotos, "review_photos")
        ).map((item) => item.url);
      }
      await reviewsApi.createReview({
        order_id: String(reviewOrder.id),
        rating: reviewRating,
        comment,
        ...(photoUrls?.length ? { photoUrls } : {}),
      });
      closeReviewModal();
      setReviewComment("");
      await loadOrders();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? (e.body.message ?? e.body.error ?? t("list.submitReviewFailed"))
          : e instanceof Error
            ? e.message
            : t("list.submitReviewFailed");
      setReviewError(msg);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleReviewPhotosChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;
    const incoming = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );
    setReviewPhotos((prev) => {
      const merged = [...prev, ...incoming];
      return merged.slice(0, MAX_REVIEW_PHOTOS);
    });
    event.target.value = "";
    setReviewError(null);
  };

  const removeReviewPhoto = (idx: number) => {
    setReviewPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAction = async (orderId: number, action: string) => {
    try {
      switch (action) {
        case "accept":
          await ordersApi.acceptOrder(orderId);
          break;
        case "reject":
          await ordersApi.rejectOrder(orderId, {
            reason: "Rejected by provider",
          });
          break;
        case "complete":
          await ordersApi.completeOrder(orderId);
          break;
        case "confirm":
          await ordersApi.confirmOrder(orderId);
          break;
        case "review": {
          const o = orders.find((x) => x.id === orderId);
          if (o?.status === "reviewed") return;
          if (o) {
            setReviewRating(5);
            setReviewComment("");
            setReviewPhotos([]);
            setReviewError(null);
            setReviewOrder(o);
          }
          return;
        }
      }
      await loadOrders();
    } catch (err) {
      console.error(`Action "${action}" failed:`, err);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("list.title")}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t("list.subtitle")}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
            {!loading && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <OrdersSkeleton />
      ) : error ? (
        <ErrorState onRetry={loadOrders} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              serviceTitle={serviceTitles[order.service_id]}
              role={role}
              counterpartyName={
                role === "admin"
                  ? t("list.adminParties", {
                      providerId: order.provider_id,
                      customerId: order.customer_id,
                    })
                  : role === "customer"
                    ? partyByUserId[order.provider_id]?.name
                    : partyByUserId[order.customer_id]?.name
              }
              counterpartyAvatarUrl={
                role === "customer"
                  ? partyByUserId[order.provider_id]?.avatarUrl
                  : role === "provider"
                    ? partyByUserId[order.customer_id]?.avatarUrl
                    : undefined
              }
              onAction={handleAction}
              onPaymentSuccess={loadOrders}
            />
          ))}
        </div>
      )}

      {reviewOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t("list.close")}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeReviewModal}
          />
          <div className="relative z-10 flex max-h-[min(90vh,640px)] w-full max-w-md flex-col overflow-y-auto rounded-xl border border-gray-100 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {t("list.reviewTitle")}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {t("list.reviewOrder", { id: reviewOrder.id })}
              {serviceTitles[reviewOrder.service_id]
                ? ` · ${serviceTitles[reviewOrder.service_id]}`
                : ""}
            </p>

            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              {t("list.rating")}
            </p>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setReviewRating(n)}
                  disabled={reviewSubmitting}
                  className={`text-2xl leading-none px-1 transition-transform hover:scale-110 disabled:opacity-50 ${
                    n <= reviewRating ? "" : "grayscale opacity-30"
                  }`}
                  aria-label={t("list.ratingAria", { n })}
                >
                  ★
                </button>
              ))}
            </div>

            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              {t("list.comment")}
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
              disabled={reviewSubmitting}
              placeholder={t("list.commentPlaceholder")}
              className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#486284] focus:outline-none focus:ring-2 focus:ring-[#486284]/30 disabled:bg-gray-50"
            />

            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              {t("list.photosOptional")}
            </p>
            <div className="mb-4 flex flex-wrap items-start gap-2">
              {reviewPhotoPreviews.map((src, index) => (
                <div
                  key={`${reviewPhotos[index]?.name ?? "photo"}-${reviewPhotos[index]?.lastModified ?? index}`}
                  className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200"
                >
                  <img
                    src={src}
                    alt=""
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label={t("list.removePhoto")}
                    disabled={reviewSubmitting}
                    onClick={() => removeReviewPhoto(index)}
                    className="absolute right-0.5 top-0.5 flex size-6 items-center justify-center rounded-full bg-black/55 text-white shadow-sm hover:bg-black/75 disabled:pointer-events-none"
                  >
                    <IoClose className="size-4" aria-hidden />
                  </button>
                </div>
              ))}
              {reviewPhotos.length < MAX_REVIEW_PHOTOS ? (
                <>
                  <input
                    type="file"
                    id="review-order-photos"
                    accept="image/*"
                    multiple
                    disabled={reviewSubmitting}
                    onChange={handleReviewPhotosChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="review-order-photos"
                    className={`flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500 transition-colors hover:border-[#486284]/45 hover:bg-[#486284]/[0.06] hover:text-[#486284] ${
                      reviewSubmitting
                        ? "pointer-events-none opacity-45"
                        : ""
                    }`}
                  >
                    <HiOutlinePhotograph className="size-7" aria-hidden />
                    <span className="px-1 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide">
                      {t("list.addPhoto")}
                    </span>
                  </label>
                </>
              ) : null}
            </div>
            <p className="mb-4 text-[11px] leading-snug text-gray-400">
              {t("list.photosHint", {
                max: MAX_REVIEW_PHOTOS,
                mb: REVIEW_IMAGE_MAX_MB,
              })}
            </p>

            {reviewError && (
              <p className="text-sm text-red-600 mb-3">{reviewError}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={closeReviewModal}
                disabled={reviewSubmitting}
                className="rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                {t("list.cancel")}
              </button>
              <button
                type="button"
                disabled={reviewSubmitting}
                onClick={() => void submitReview()}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#486284] hover:bg-[#3a5270] rounded-lg disabled:opacity-50"
              >
                {reviewSubmitting ? t("list.sending") : t("list.submit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
