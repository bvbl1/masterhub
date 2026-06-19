"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import LocationMap, {
  MapCityPreview,
  type MapResolvedPlace,
} from "@/components/common/Map";
import PhotoLightbox from "@/components/common/PhotoLightbox";
import { pickAvatarUrlFromRaw } from "@/lib/api";
import type { JobRequest, JobRequestResponse, User } from "@/lib/api";
import { formatCurrency, formatCurrencyRange } from "@/lib/formatCurrency";
import { useRequestsTranslation } from "@/lib/i18n/useRequestsTranslation";

function Pill({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

function BidBadge({ status, label }: { status: string; label: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    accepted: "bg-emerald-50 text-emerald-800 border-emerald-200",
    rejected: "bg-rose-50 text-rose-800 border-rose-200",
    withdrawn: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${map[status] ?? map.withdrawn}`}
    >
      {label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-base font-bold leading-snug text-slate-900 sm:text-lg">
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function ReferencePhotos({ urls }: { urls: string[] }) {
  const { t } = useRequestsTranslation();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const list = urls.filter(Boolean);
  if (list.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-500">
          {t("detail.referencePhotos")}
        </h2>
        <span className="text-xs font-medium text-slate-400">
          {list.length}{" "}
          {list.length === 1 ? t("detail.image_one") : t("detail.image")}
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {list.map((href, i) => (
          <button
            key={`${href}-${i}`}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:h-36 sm:w-36"
            aria-label={t("detail.openPhoto", { index: i + 1 })}
          >
            <Image
              src={href}
              alt=""
              fill
              className="object-cover"
              sizes="144px"
              unoptimized
            />
          </button>
        ))}
      </div>
      <PhotoLightbox
        urls={list}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </section>
  );
}

function JobLocationMap({ city }: { city: string }) {
  const { t } = useRequestsTranslation();
  if (!city.trim()) return null;
  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold text-slate-500">
        {t("detail.jobLocation")}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <MapCityPreview city={city} mapHeightPx={280} />
      </div>
      <p className="mt-2 text-xs text-slate-500">{t("detail.locationHint")}</p>
    </section>
  );
}

function PostedByCard({ poster, isOwner }: { poster: User | null; isOwner: boolean }) {
  const { t } = useRequestsTranslation();
  const name = poster
    ? `${poster.firstName} ${poster.secondName}`.trim() || t("detail.customer")
    : t("detail.customer");
  const avatar = poster
    ? poster.avatarUrl ??
      pickAvatarUrlFromRaw(poster as unknown as Record<string, unknown>)
    : undefined;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {t("detail.postedBy")}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-100">
          {avatar ? (
            <Image src={avatar} alt="" fill className="object-cover" unoptimized />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-bold text-[#486284]">
              {name.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-900">
            {isOwner ? t("detail.you") : name}
          </p>
          {!isOwner && poster ? (
            <p className="mt-0.5 text-xs text-slate-500">{t("detail.author")}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const bidFieldClass =
  "w-full rounded-xl border-0 bg-[#F0F2F5] px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#486284]/25";

const modalFieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#486284] focus:ring-2 focus:ring-[#486284]/20";

export type JobRequestDetailViewProps = {
  jr: JobRequest;
  categoryName: string;
  isOwner: boolean;
  isProvider: boolean;
  poster: User | null;
  pendingBidCount: number;
  responses: JobRequestResponse[];
  providerNames: Record<string, string>;
  formatWhen: (iso: string) => string;
  bidPrice: string;
  setBidPrice: (v: string) => void;
  bidComment: string;
  setBidComment: (v: string) => void;
  bidDays: string;
  setBidDays: (v: string) => void;
  bidSubmitting: boolean;
  bidError: string;
  myBid: JobRequestResponse | null;
  onBid: () => void;
  onWithdraw: () => void;
  onCancelRequest: () => void;
  onShare: () => void;
  onOpenAccept: (r: JobRequestResponse) => void;
  acceptOpen: boolean;
  acceptTarget: JobRequestResponse | null;
  acceptSubmitting: boolean;
  acceptMsg: string;
  street: string;
  setStreet: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  region: string;
  setRegion: (v: string) => void;
  scheduledAt: string;
  setScheduledAt: (v: string) => void;
  onCloseAccept: () => void;
  onSubmitAccept: () => void;
  onMapPlace: (p: MapResolvedPlace) => void;
};

export default function JobRequestDetailView({
  jr,
  categoryName,
  isOwner,
  isProvider,
  poster,
  pendingBidCount,
  responses,
  providerNames,
  formatWhen,
  bidPrice,
  setBidPrice,
  bidComment,
  setBidComment,
  bidDays,
  setBidDays,
  bidSubmitting,
  bidError,
  myBid,
  onBid,
  onWithdraw,
  onCancelRequest,
  onShare,
  onOpenAccept,
  acceptOpen,
  acceptTarget,
  acceptSubmitting,
  acceptMsg,
  street,
  setStreet,
  city,
  setCity,
  region,
  setRegion,
  scheduledAt,
  setScheduledAt,
  onCloseAccept,
  onSubmitAccept,
  onMapPlace,
}: JobRequestDetailViewProps) {
  const { t, bidStatusLabel } = useRequestsTranslation();

  const statusPill =
    jr.status === "open" ? (
      <Pill className="bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
        {t("status.openPill")}
      </Pill>
    ) : jr.status === "closed" ? (
      <Pill className="bg-slate-100 text-slate-700 ring-1 ring-slate-200">
        {t("status.closedPill")}
      </Pill>
    ) : (
      <Pill className="bg-amber-50 text-amber-800 ring-1 ring-amber-200/80">
        {t("status.cancelledPill")}
      </Pill>
    );

  const activityValue =
    isOwner && jr.status === "open" && pendingBidCount > 0
      ? t("detail.activityReview", {
          total: jr.responseCount,
          pending: pendingBidCount,
        })
      : jr.responseCount === 1
        ? t("detail.bidsReceived_one", { count: jr.responseCount })
        : t("detail.bidsReceived", { count: jr.responseCount });

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 pb-16 sm:px-6 lg:py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/requests"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#486284]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            {isOwner ? t("detail.backMyRequests") : t("detail.backMarketplace")}
          </Link>
          <button
            type="button"
            onClick={onShare}
            className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/90 transition hover:bg-slate-50"
          >
            {t("detail.share")}
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {categoryName ? (
            <Pill className="bg-violet-100 text-violet-800 ring-1 ring-violet-200/80">
              {categoryName}
            </Pill>
          ) : null}
          {statusPill}
        </div>

        <h1 className="mb-8 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem]">
          {jr.title}
        </h1>

        <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label={t("detail.location")}
            value={
              jr.city.toLowerCase().includes("kazakhstan")
                ? jr.city
                : `${jr.city}${t("detail.kazakhstanSuffix")}`
            }
          />
          <SummaryCard
            label={t("detail.budgetRange")}
            value={formatCurrencyRange(jr.budgetMin, jr.budgetMax)}
            sub={t("detail.estimatedTotal")}
          />
          <SummaryCard
            label={t("detail.preferredTime")}
            value={formatWhen(jr.scheduledAt)}
          />
          <SummaryCard label={t("detail.activity")} value={activityValue} />
        </div>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
          <div className="space-y-8 lg:col-span-2">
            <section>
              <h2 className="mb-4 text-sm font-semibold text-slate-500">
                {t("detail.description")}
              </h2>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-6 sm:p-8">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 sm:text-base">
                  {jr.description}
                </p>
              </div>
            </section>

            <ReferencePhotos urls={jr.photoUrls ?? []} />

            <JobLocationMap city={jr.city} />

            {isOwner && jr.status === "open" && pendingBidCount > 0 ? (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-900">
                <p className="font-semibold text-sky-950">
                  {pendingBidCount === 1
                    ? t("detail.bidsWaiting_one")
                    : t("detail.bidsWaiting", { count: pendingBidCount })}
                </p>
                <p className="mt-1 text-xs text-sky-800/90">
                  {t("detail.bidsWaitingHint")}
                </p>
              </div>
            ) : null}

            {isOwner && jr.status === "closed" ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                <p className="font-semibold text-emerald-950">
                  {t("detail.orderCreated")}
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  {t("detail.orderCreatedHint")}{" "}
                  <Link
                    href="/orders"
                    className="font-semibold text-[#486284] underline"
                  >
                    {t("detail.orders")}
                  </Link>{" "}
                  {t("detail.orderCreatedSuffix")}
                </p>
              </div>
            ) : null}

            {isOwner && jr.status === "cancelled" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <p className="font-semibold text-amber-950">
                  {t("detail.requestCancelled")}
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  <Link
                    href="/requests/new"
                    className="font-semibold text-[#486284] underline"
                  >
                    {t("detail.postNew")}
                  </Link>{" "}
                  {t("detail.postNewSuffix")}
                </p>
              </div>
            ) : null}

            {isProvider && jr.status === "closed" ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p className="font-semibold text-slate-900">
                  {t("detail.requestClosed")}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {t("detail.requestClosedHint")}{" "}
                  <Link
                    href="/orders"
                    className="font-semibold text-[#486284] underline"
                  >
                    {t("detail.orders")}
                  </Link>{" "}
                  {t("detail.requestClosedSuffix")}
                </p>
              </div>
            ) : null}

            {isOwner ? (
              <section>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {t("detail.bidsFromProviders")}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {jr.status === "open" && responses.length === 0
                        ? t("detail.noBidsYet")
                        : jr.status === "open" && responses.length > 0
                          ? `${t("detail.offersCount", { count: responses.length })}${pendingBidCount > 0 ? t("detail.offersPending", { count: pendingBidCount }) : ""}`
                          : t("detail.onRecord", { count: responses.length })}
                    </p>
                  </div>
                  {jr.status === "open" && pendingBidCount > 0 ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-200/80">
                      {t("detail.actionNeeded")}
                    </span>
                  ) : null}
                </div>

                {responses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                    <p className="font-semibold text-slate-900">
                      {jr.status === "open"
                        ? t("detail.waitingFirstBid")
                        : t("detail.noBidsRecorded")}
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                      {jr.status === "open"
                        ? t("detail.waitingFirstBidHint")
                        : t("detail.noBidsRecordedHint")}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {responses.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-2xl bg-white p-5 shadow-sm sm:p-6"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <Link
                              href={`/provider/${r.providerId}`}
                              className="text-base font-bold text-[#486284] hover:underline"
                            >
                              {providerNames[String(r.providerId)] ??
                                `Provider #${r.providerId}`}
                            </Link>
                            <div className="mt-2">
                              <BidBadge
                                status={r.status}
                                label={bidStatusLabel(r.status)}
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              {t("detail.proposed")}
                            </p>
                            <p className="text-xl font-bold tabular-nums text-slate-900">
                              {formatCurrency(r.proposedPrice)}
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-slate-600">
                          {r.comment}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          {r.estimatedDays === 1
                            ? t("detail.estDays_one", { count: r.estimatedDays })
                            : t("detail.estDays", { count: r.estimatedDays })}
                        </p>
                        {jr.status === "open" && r.status === "pending" ? (
                          <button
                            type="button"
                            onClick={() => onOpenAccept(r)}
                            className="mt-5 w-full rounded-xl bg-[#486284] py-3 text-sm font-semibold text-white transition hover:bg-[#3a5270] sm:w-auto sm:px-6"
                          >
                            {t("detail.acceptCreateOrder")}
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : null}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            {isProvider && jr.status === "open" ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md sm:p-7">
                <h2 className="text-xl font-bold text-slate-900">
                  {myBid?.status === "pending"
                    ? t("detail.yourBid")
                    : t("detail.placeBid")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t("detail.bidSidebarHint")}
                </p>

                {bidError ? (
                  <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {bidError}
                  </p>
                ) : null}

                {myBid?.status === "pending" ? (
                  <div className="mt-5">
                    <p className="text-2xl font-bold text-slate-900">
                      {formatCurrency(myBid.proposedPrice)}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                      {myBid.comment}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      {t("detail.estDays", { count: myBid.estimatedDays })} ·{" "}
                      <BidBadge
                        status={myBid.status}
                        label={bidStatusLabel(myBid.status)}
                      />
                    </p>
                    <button
                      type="button"
                      onClick={onWithdraw}
                      className="mt-5 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {t("detail.withdrawBid")}
                    </button>
                    <p className="mt-3 text-center text-xs text-slate-400">
                      {t("detail.withdrawHint")}
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("detail.proposedPrice")}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={bidPrice}
                          onChange={(e) => setBidPrice(e.target.value)}
                          className={`${bidFieldClass} pr-10`}
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                          ₸
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("detail.estimatedCompletion")}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={bidDays}
                          onChange={(e) => setBidDays(e.target.value)}
                          className={`${bidFieldClass} pr-14`}
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                          {t("detail.days")}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("detail.proposalComment")}
                      </label>
                      <textarea
                        rows={4}
                        value={bidComment}
                        onChange={(e) => setBidComment(e.target.value)}
                        placeholder={t("detail.proposalPlaceholder")}
                        className={`${bidFieldClass} min-h-[120px] resize-y`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={onBid}
                      disabled={bidSubmitting}
                      className="w-full rounded-xl bg-[#486284] py-3.5 text-sm font-semibold text-white transition hover:bg-[#3a5270] disabled:opacity-50"
                    >
                      {bidSubmitting ? t("detail.sending") : t("detail.submitBid")}
                    </button>
                    <p className="text-center text-xs leading-relaxed text-slate-400">
                      {t("detail.afterBidHint")}
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {isOwner && jr.status === "open" ? (
              <button
                type="button"
                onClick={onCancelRequest}
                className="w-full rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                {t("detail.cancelRequest")}
              </button>
            ) : null}

            <PostedByCard poster={poster} isOwner={isOwner} />
          </aside>
        </div>
      </div>

      {acceptOpen && acceptTarget ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-hidden
            onClick={() => !acceptSubmitting && onCloseAccept()}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 max-h-[min(92vh,880px)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <h3 className="text-xl font-bold text-slate-900">
              {t("detail.confirmAddress")}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {t("detail.orderPendingAt")}{" "}
              <span className="font-semibold">{t("detail.pendingPayment")}</span>{" "}
              {t("detail.orderPendingAtPrice", {
                price: formatCurrency(acceptTarget.proposedPrice),
              })}
            </p>
            {acceptMsg ? (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {acceptMsg}
              </p>
            ) : null}
            <div className="mt-6 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                  {t("detail.map")}
                </p>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <LocationMap
                    onPlaceResolved={onMapPlace}
                    mapHeightPx={260}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
                  {t("detail.street")}
                </label>
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className={modalFieldClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
                    {t("detail.city")}
                  </label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={modalFieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
                    {t("detail.region")}
                  </label>
                  <input
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className={modalFieldClass}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
                  {t("detail.scheduledTime")}
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className={modalFieldClass}
                />
              </div>
            </div>
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={acceptSubmitting}
                onClick={onCloseAccept}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {t("detail.cancel")}
              </button>
              <button
                type="button"
                disabled={acceptSubmitting}
                onClick={onSubmitAccept}
                className="rounded-xl bg-[#486284] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3a5270] disabled:opacity-50"
              >
                {acceptSubmitting
                  ? t("detail.working")
                  : t("detail.confirmGoOrder")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
