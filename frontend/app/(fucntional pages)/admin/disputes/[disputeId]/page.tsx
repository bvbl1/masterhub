"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { ordersApi, type DisputedOrderListEntry } from "@/lib/api";
import StatusBadge from "@/components/orders/StatusBadge";
import {
  DISPUTE_RESOLUTIONS,
  enrichDisputes,
  type DisputeEnrichment,
  type DisputePartyDetail,
} from "../disputeHelpers";
import { formatCurrency } from "@/lib/formatCurrency";
import PhotoGallery from "@/components/common/PhotoGallery";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

function telHref(phone: string): string {
  const cleaned = phone.trim().replace(/[^\d+]/g, "");
  return cleaned.length > 0 ? `tel:${cleaned}` : `tel:${phone.trim()}`;
}

function ContactPartyModal({
  title,
  party,
  onClose,
}: {
  title: string;
  party: DisputePartyDetail;
  onClose: () => void;
}) {
  const { t } = useAdminTranslation();
  const email = party.email?.trim();
  const phone = party.phone?.trim();
  const hasEmail = Boolean(email);
  const hasPhone = Boolean(phone);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center sm:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-party-title"
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3
          id="contact-party-title"
          className="text-base font-semibold text-slate-900"
        >
          {title}
        </h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          {t("disputeDetail.contactModalHint")}
        </p>
        {!hasEmail && !hasPhone ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {t("disputeDetail.noContactInfo")}
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            <li>
              {hasEmail ? (
                <a
                  href={`mailto:${email}`}
                  onClick={() => onClose()}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 hover:border-[#486284]/35 hover:bg-slate-50"
                >
                  {t("disputeDetail.writeEmail")}
                  <span className="text-[#486284]">→</span>
                </a>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
                  {t("disputeDetail.emailUnavailable")}
                </div>
              )}
            </li>
            <li>
              {hasPhone ? (
                <a
                  href={telHref(phone!)}
                  onClick={() => onClose()}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 hover:border-[#486284]/35 hover:bg-slate-50"
                >
                  {t("disputeDetail.call")}
                  <span className="text-xs font-normal text-slate-500">
                    {phone}
                  </span>
                </a>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
                  {t("disputeDetail.phoneUnavailable")}
                </div>
              )}
            </li>
          </ul>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          {t("disputeDetail.close")}
        </button>
      </div>
    </div>
  );
}

export default function AdminDisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeIdParam = params.disputeId;
  const disputeId = useMemo(() => {
    const n = Number(
      Array.isArray(disputeIdParam) ? disputeIdParam[0] : disputeIdParam,
    );
    return Number.isFinite(n) && n > 0 ? n : NaN;
  }, [disputeIdParam]);

  const { t } = useAdminTranslation();
  const { user, loading: authLoading } = useAuth();
  const [entry, setEntry] = useState<DisputedOrderListEntry | null>(null);
  const [detail, setDetail] = useState<DisputeEnrichment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [contactTarget, setContactTarget] = useState<
    null | "customer" | "provider"
  >(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(disputeId)) {
      setEntry(null);
      setDetail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const list = await ordersApi.listDisputedOrders();
      const found = list.find((e) => e.disputeId === disputeId) ?? null;
      setEntry(found);
      if (!found) {
        setDetail(null);
        return;
      }
      const map = await enrichDisputes([found]);
      setDetail(map[found.disputeId] ?? null);
    } catch {
      setError(t("disputeDetail.loadError"));
      setEntry(null);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [disputeId, t]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") return;
    void load();
  }, [authLoading, user, load]);

  useEffect(() => {
    if (!contactTarget) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setContactTarget(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [contactTarget]);

  const resolveDispute = async (resolutionValue: string) => {
    if (!entry) return;
    const orderId = entry.order.id;
    setResolving(true);
    setActionError("");
    try {
      await ordersApi.resolveDisputedOrder(orderId, {
        resolution: resolutionValue.trim(),
      });
      router.push("/admin/disputes");
      router.refresh();
    } catch {
      setActionError(t("disputeDetail.applyFailed"));
    } finally {
      setResolving(false);
    }
  };

  const confirmAndResolve = (resolutionValue: "completed" | "cancelled") => {
    const msg =
      resolutionValue === "completed"
        ? t("disputeDetail.confirmCompleted")
        : t("disputeDetail.confirmCancelled");
    if (!window.confirm(msg)) return;
    void resolveDispute(resolutionValue);
  };

  const o = entry?.order;

  if (authLoading) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-16 text-center text-gray-500">
        {t("common.loading")}
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-16 text-center">
        <p className="text-gray-700 mb-4">{t("common.adminAreaOnly")}</p>
        <Link
          href="/dashboard"
          className="text-[#486284] font-medium hover:underline"
        >
          {t("common.backToDashboard")}
        </Link>
      </div>
    );
  }

  if (!Number.isFinite(disputeId)) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-12">
        <p className="text-slate-600">{t("disputeDetail.invalidLink")}</p>
        <Link
          href="/admin/disputes"
          className="mt-4 inline-block text-[#486284] font-medium"
        >
          {t("disputeDetail.allDisputes")}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-12 text-sm text-slate-500">
        {t("disputeDetail.loading")}
      </div>
    );
  }

  if (error || !entry || !o) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-12">
        <p className="text-red-600 text-sm">
          {error || t("disputeDetail.notFound")}
        </p>
        <Link
          href="/admin/disputes"
          className="mt-4 inline-block text-[#486284] font-medium"
        >
          {t("disputeDetail.allDisputes")}
        </Link>
      </div>
    );
  }

  const d = detail;

  return (
    <>
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Link
          href="/admin/disputes"
          className="text-sm font-semibold text-[#486284] hover:underline"
        >
          {t("disputeDetail.allDisputes")}
        </Link>
        <span className="text-slate-300">|</span>
        <Link
          href="/admin"
          className="text-sm text-slate-500 hover:text-[#486284]"
        >
          {t("disputeDetail.adminHome")}
        </Link>
      </div>

      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t("disputeDetail.disputeTitle", { id: entry.disputeId })}
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
            <span>{t("disputeDetail.orderNumber", { id: o.id })}</span>
            <StatusBadge status={o.status} />
            {entry.createdAt ? (
              <span>· {new Date(entry.createdAt).toLocaleString()}</span>
            ) : null}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              {t("disputeDetail.parties")}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-[10px] font-semibold uppercase text-slate-400">
                  {t("common.customer")}
                </p>
                <p className="font-medium text-slate-900 mt-1">
                  {d?.customer.name}
                </p>
                {d?.customer.email ? (
                  <a
                    href={`mailto:${d.customer.email}`}
                    className="text-sm text-[#486284] hover:underline mt-1 inline-block"
                  >
                    {d.customer.email}
                  </a>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">
                    {t("disputeDetail.emailNotOnFile")}
                  </p>
                )}
                {d?.customer.phone ? (
                  <a
                    href={telHref(d.customer.phone)}
                    className="text-sm text-[#486284] hover:underline mt-1 block"
                  >
                    {d.customer.phone}
                  </a>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">
                    {t("disputeDetail.phoneNotOnFile")}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-[10px] font-semibold uppercase text-slate-400">
                  {t("common.provider")}
                </p>
                <Link
                  href={`/provider/${o.provider_id}`}
                  className="font-medium text-[#486284] hover:underline mt-1 block"
                >
                  {d?.provider.name}
                </Link>
                {d?.provider.email ? (
                  <a
                    href={`mailto:${d.provider.email}`}
                    className="text-sm text-[#486284] hover:underline mt-1 inline-block"
                  >
                    {d.provider.email}
                  </a>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">
                    {t("disputeDetail.emailNotOnFile")}
                  </p>
                )}
                {d?.provider.phone ? (
                  <a
                    href={telHref(d.provider.phone)}
                    className="text-sm text-[#486284] hover:underline mt-1 block"
                  >
                    {d.provider.phone}
                  </a>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">
                    {t("disputeDetail.phoneNotOnFile")}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-[10px] font-semibold uppercase text-slate-400">
                {t("disputeDetail.service")}
              </p>
              <Link
                href={`/dashboard/${o.service_id}`}
                className="font-medium text-[#486284] hover:underline mt-1 inline-block"
              >
                {d?.serviceTitle}
              </Link>
            </div>

            {entry.raisedBy > 0 ? (
              <p className="text-xs text-slate-600 mt-4">
                <span className="text-slate-400">{t("disputeDetail.raisedBy")}</span>{" "}
                <span className="font-medium">{d?.raisedBy.name}</span>
                {d?.raisedBy.email ? (
                  <span className="text-slate-500"> · {d.raisedBy.email}</span>
                ) : null}
              </p>
            ) : null}
          </section>

          {entry.disputeReason ? (
            <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-amber-900 uppercase tracking-wide">
                {t("disputeDetail.disputeReason")}
              </h2>
              <p className="mt-3 text-sm text-slate-800 whitespace-pre-wrap wrap-break-word leading-relaxed">
                {entry.disputeReason}
              </p>
            </section>
          ) : null}

          {(entry.photoUrls ?? o.photoUrls)?.length ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                {t("disputeDetail.disputePhotos")}
              </h2>
              <div className="mt-4">
                <PhotoGallery
                  urls={entry.photoUrls ?? o.photoUrls ?? []}
                  size="md"
                />
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              {t("disputeDetail.orderSummary")}
            </h2>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-400">{t("disputeDetail.agreedPrice")}</dt>
                <dd className="font-medium text-slate-900">
                  {formatCurrency(o.agreed_price, { decimals: 2 })}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">{t("disputeDetail.scheduled")}</dt>
                <dd className="font-medium text-slate-900">
                  {new Date(o.scheduled_at).toLocaleString()}
                </dd>
              </div>
            </dl>
            <Link
              href={`/orders/${o.id}`}
              className="mt-4 inline-block text-sm font-semibold text-[#486284] hover:underline"
            >
              {t("disputeDetail.openFullOrder")}
            </Link>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-2">
              {t("disputeDetail.contactParties")}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("disputeDetail.contactHint")}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setContactTarget("customer")}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-[#486284]/35 hover:bg-slate-50 transition-colors"
              >
                {t("disputeDetail.contactCustomer")}
              </button>
              <button
                type="button"
                onClick={() => setContactTarget("provider")}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-[#486284]/35 hover:bg-slate-50 transition-colors"
              >
                {t("disputeDetail.contactProvider")}
              </button>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-1">
          {o.status === "disputed" ? (
            <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-slate-900">
                {t("disputeDetail.resolution")}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("disputeDetail.resolutionHint")}
              </p>
              <div className="flex flex-col gap-2">
                {DISPUTE_RESOLUTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    disabled={resolving}
                    onClick={() =>
                      confirmAndResolve(r.value as "completed" | "cancelled")
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-[#486284]/35 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    {r.value === "completed"
                      ? t("disputeDetail.markCompleted")
                      : t("disputeDetail.markCancelled")}
                  </button>
                ))}
              </div>
              {actionError ? (
                <p className="text-xs text-red-600">{actionError}</p>
              ) : resolving ? (
                <p className="text-xs text-slate-500">{t("disputeDetail.applying")}</p>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
      {contactTarget && d ? (
        <ContactPartyModal
          title={
            contactTarget === "customer"
              ? t("disputeDetail.contactCustomer")
              : t("disputeDetail.contactProvider")
          }
          party={contactTarget === "customer" ? d.customer : d.provider}
          onClose={() => setContactTarget(null)}
        />
      ) : null}
    </>
  );
}
