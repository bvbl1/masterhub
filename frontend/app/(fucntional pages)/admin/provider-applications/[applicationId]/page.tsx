"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  ApiError,
  authApi,
  mediaApi,
  providerApplicationApi,
  type ProviderApplication,
  type User,
} from "@/lib/api";

import { providerDocSlotLabel } from "@/lib/providerApplicationDocSlots";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

function fileLabelFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const seg = path.split("/").pop();
    return seg && seg.length > 0 ? decodeURIComponent(seg) : url;
  } catch {
    const s = url.split("?")[0];
    const seg = s.split("/").pop();
    return seg ? decodeURIComponent(seg) : url;
  }
}

function isPdfUrl(url: string): boolean {
  const path = url.split("?")[0].split("#")[0].toLowerCase();
  return path.endsWith(".pdf");
}

function isImageUrl(url: string): boolean {
  const path = url.split("?")[0].split("#")[0].toLowerCase();
  return /\.(jpe?g|png|gif|webp|bmp)$/i.test(path);
}

/** Порядок совпадает с `DOC_SLOTS` в `ProviderBecomeModal.tsx` (обязательные 1–3, затем опциональный 4-й). */

type TaggedUrl = { url: string; docIndex: number; slotLabel: string };

export default function AdminProviderApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = String(params.applicationId ?? "");

  const { t, applicationStatusLabel } = useAdminTranslation();
  const { user, loading: authLoading } = useAuth();
  const [application, setApplication] = useState<ProviderApplication | null>(
    null,
  );
  /** undefined = loading, null = error */
  const [applicant, setApplicant] = useState<User | null | undefined>(
    undefined,
  );
  const [loadState, setLoadState] = useState<"loading" | "ready" | "notfound">(
    "loading",
  );
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejectFlowOpen, setRejectFlowOpen] = useState(false);
  const [activePdfIndex, setActivePdfIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [viewableDocUrls, setViewableDocUrls] = useState<string[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!applicationId) {
      setLoadState("notfound");
      return;
    }
    setLoadState("loading");
    setError("");
    try {
      const app =
        await providerApplicationApi.getProviderApplicationAdminById(
          applicationId,
        );
      if (!app) {
        setApplication(null);
        setLoadState("notfound");
        return;
      }
      setApplication(app);
      setLoadState("ready");
      setApplicant(undefined);
      try {
        const { user: u } = await authApi.getProviderInfo(app.userId);
        setApplicant(u);
      } catch {
        setApplicant(null);
      }
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.body.message ?? e.body.error ?? t("applicationDetail.loadFailed"));
      } else {
        setError(t("applicationDetail.loadFailed"));
      }
      setLoadState("notfound");
    }
  }, [applicationId, t]);

  useEffect(() => {
    if (authLoading || !user || user.role !== "admin") return;
    void load();
  }, [authLoading, user, load]);

  useEffect(() => {
    setActivePdfIndex(0);
    setActiveImageIndex(0);
  }, [applicationId, application?.documentUrls?.join("|")]);

  useEffect(() => {
    const urls = application?.documentUrls ?? [];
    if (urls.length === 0) {
      setViewableDocUrls([]);
      setDocsLoading(false);
      return;
    }
    let cancelled = false;
    setDocsLoading(true);
    void mediaApi
      .resolveProviderDocumentViewUrls(urls, {
        ownerUserId: application?.userId,
      })
      .then((resolved) => {
        if (!cancelled) setViewableDocUrls(resolved);
      })
      .catch(() => {
        if (!cancelled) setViewableDocUrls(urls);
      })
      .finally(() => {
        if (!cancelled) setDocsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [application?.documentUrls?.join("|"), application?.userId]);

  useEffect(() => {
    setRejectFlowOpen(false);
    setRejectReason("");
    setRejectError("");
  }, [applicationId, application?.id]);

  const onApprove = async () => {
    if (!application || application.status !== "pending") return;
    setRejectFlowOpen(false);
    setRejectError("");
    setActionLoading(true);
    setError("");
    try {
      await providerApplicationApi.approveProviderApplicationAdmin(
        application.id,
      );
      await load();
      router.push("/admin/provider-applications");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.body.message ?? e.body.error ?? t("applicationDetail.approveFailed"));
      } else {
        setError(t("applicationDetail.approveFailed"));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const onReject = async () => {
    if (!application || application.status !== "pending") return;
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError(t("applicationDetail.rejectReasonRequired"));
      return;
    }
    setRejectError("");
    setActionLoading(true);
    setError("");
    try {
      await providerApplicationApi.rejectProviderApplicationAdmin(
        application.id,
        reason,
      );
      await load();
      router.push("/admin/provider-applications");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.body.message ?? e.body.error ?? t("applicationDetail.rejectFailed"));
      } else {
        setError(t("applicationDetail.rejectFailed"));
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16 text-center text-gray-500">
        {t("common.loading")}
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
        <p className="text-gray-700 mb-4">{t("common.adminsOnly")}</p>
        <Link
          href="/dashboard"
          className="text-[#486284] font-medium hover:underline"
        >
          {t("common.dashboard")}
        </Link>
      </div>
    );
  }

  if (loadState === "loading") {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16 text-center text-gray-500">
        {t("applicationDetail.loadingApplication")}
      </div>
    );
  }

  if (loadState === "notfound" || !application) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
        <p className="text-gray-700 mb-2">{t("applicationDetail.notFound")}</p>
        {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}
        <Link
          href="/admin/provider-applications"
          className="text-[#486284] font-medium hover:underline"
        >
          {t("applicationDetail.backToList")}
        </Link>
      </div>
    );
  }

  const applicantDisplayName =
    applicant != null
      ? `${applicant.firstName} ${applicant.secondName}`.trim() ||
        applicant.email
      : applicant === null
        ? "—"
        : "…";

  const docUrls = application.documentUrls;
  const displayDocUrls =
    viewableDocUrls.length === docUrls.length
      ? viewableDocUrls
      : docUrls;
  const pdfsTagged: TaggedUrl[] = docUrls
    .map((storedUrl, docIndex) => ({
      url: displayDocUrls[docIndex] ?? storedUrl,
      docIndex,
      slotLabel: providerDocSlotLabel(docIndex),
    }))
    .filter((x) => isPdfUrl(docUrls[x.docIndex] ?? ""));
  const imagesTagged: TaggedUrl[] = docUrls
    .map((storedUrl, docIndex) => ({
      url: displayDocUrls[docIndex] ?? storedUrl,
      docIndex,
      slotLabel: providerDocSlotLabel(docIndex),
    }))
    .filter(
      (x) =>
        isImageUrl(docUrls[x.docIndex] ?? "") &&
        !isPdfUrl(docUrls[x.docIndex] ?? ""),
    );
  const otherUrls = docUrls
    .map((storedUrl, docIndex) => ({
      url: displayDocUrls[docIndex] ?? storedUrl,
      docIndex,
    }))
    .filter(
      (x) =>
        !isPdfUrl(docUrls[x.docIndex] ?? "") &&
        !isImageUrl(docUrls[x.docIndex] ?? ""),
    );
  const pdfIdx = pdfsTagged.length
    ? Math.min(activePdfIndex, pdfsTagged.length - 1)
    : 0;
  const imgIdx = imagesTagged.length
    ? Math.min(activeImageIndex, imagesTagged.length - 1)
    : 0;

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <nav className="text-sm text-gray-500 mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link
          href="/admin"
          className="text-[#486284] hover:underline font-medium"
        >
          {t("applicationDetail.breadcrumbAdmin")}
        </Link>
        <span className="text-gray-300" aria-hidden>
          /
        </span>
        <Link
          href="/admin/provider-applications"
          className="text-[#486284] hover:underline font-medium"
        >
          {t("applicationDetail.breadcrumbApplications")}
        </Link>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("applicationDetail.applicationTitle", { id: application.id })}
          </h1>
          {application.status !== "pending" ? (
            <p
              className={`inline-block mt-2 text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                application.status === "approved"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {applicationStatusLabel(application.status)}
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          {t("applicationDetail.applicant")}
        </h2>
        <div className="flex gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-200 shrink-0">
            {applicant?.avatarUrl ? (
              <Image
                src={applicant.avatarUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-lg font-semibold">
                {(applicant != null ? applicantDisplayName : "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">
              {applicant === undefined
                ? t("applicationDetail.loadingApplicant")
                : applicantDisplayName}
            </p>
            {applicant ? (
              <>
                <p className="text-sm text-gray-600">{applicant.email}</p>
                {applicant.phone ? (
                  <p className="text-sm text-gray-600">{applicant.phone}</p>
                ) : null}
                <p className="text-xs text-gray-500 mt-1">
                  {t("applicationDetail.userId", { id: application.userId })}
                </p>
                <p className="text-xs text-gray-500">
                  {t("applicationDetail.currentRole", { role: applicant.role })}
                </p>
              </>
            ) : applicant === null ? (
              <p className="text-sm text-amber-700 mt-1">
                {t("applicationDetail.profileLoadError", {
                  id: application.userId,
                })}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {t("applicationDetail.timeline")}
        </h2>
        {application.createdAt ? (
          <p className="text-sm text-gray-700">
            {t("applicationDetail.submittedAt", {
              date: new Date(application.createdAt).toLocaleString(),
            })}
          </p>
        ) : null}
        {application.updatedAt ? (
          <p className="text-sm text-gray-600 mt-1">
            {t("applicationDetail.updatedAt", {
              date: new Date(application.updatedAt).toLocaleString(),
            })}
          </p>
        ) : null}
        {application.rejectionReason ? (
          <p className="text-sm text-red-700 mt-3">
            <span className="font-medium">
              {t("applicationDetail.rejectionReason")}
            </span>{" "}
            {application.rejectionReason}
          </p>
        ) : null}
      </section>

      {docUrls.length > 0 ? (
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              {t("applicationDetail.documents")}
            </h2>
            {docsLoading ? (
              <p className="text-sm text-gray-500 mt-2">{t("common.loading")}</p>
            ) : null}
          </div>

          {pdfsTagged.length > 0 ? (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                <h3 className="text-sm font-semibold text-slate-800">
                  {t("applicationDetail.pdf")}
                </h3>
                {pdfsTagged.length > 1 ? (
                  <label className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                    <span className="shrink-0">
                      {t("applicationDetail.chooseFile")}
                    </span>
                    <select
                      value={pdfIdx}
                      onChange={(e) =>
                        setActivePdfIndex(Number(e.target.value))
                      }
                      className="w-full sm:w-auto min-w-[200px] max-w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
                    >
                      {pdfsTagged.map((item, i) => (
                        <option key={docUrls[item.docIndex] ?? item.url} value={i}>
                          {item.slotLabel} — {fileLabelFromUrl(docUrls[item.docIndex] ?? item.url)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-2 mt-1">
                <span className="text-gray-500 font-normal text-xs uppercase tracking-wide mr-2">
                  {t("applicationDetail.category")}
                </span>
                {pdfsTagged[pdfIdx]?.slotLabel ?? "—"}
              </p>
              <iframe
                title={t("applicationDetail.pdfPreview")}
                src={pdfsTagged[pdfIdx]?.url}
                className="w-full min-h-[560px] rounded-lg border border-gray-200 bg-slate-50"
              />
              <a
                href={pdfsTagged[pdfIdx]?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm text-[#486284] hover:underline"
              >
                {t("applicationDetail.openPdfNewTab")}
              </a>
            </div>
          ) : null}

          {imagesTagged.length > 0 ? (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                <h3 className="text-sm font-semibold text-slate-800">
                  {t("applicationDetail.images")}
                </h3>
                {imagesTagged.length > 1 ? (
                  <label className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                    <span className="shrink-0">
                      {t("applicationDetail.chooseFile")}
                    </span>
                    <select
                      value={imgIdx}
                      onChange={(e) =>
                        setActiveImageIndex(Number(e.target.value))
                      }
                      className="w-full sm:w-auto min-w-[200px] max-w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
                    >
                      {imagesTagged.map((item, i) => (
                        <option key={docUrls[item.docIndex] ?? item.url} value={i}>
                          {item.slotLabel} — {fileLabelFromUrl(docUrls[item.docIndex] ?? item.url)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-2 mt-1">
                <span className="text-gray-500 font-normal text-xs uppercase tracking-wide mr-2">
                  Category
                </span>
                {imagesTagged[imgIdx]?.slotLabel ?? "—"}
              </p>
              <iframe
                title={t("applicationDetail.imagePreview")}
                src={imagesTagged[imgIdx]?.url}
                className="w-full min-h-[400px] max-h-[80vh] rounded-lg border border-gray-200 bg-slate-50"
              />
              <a
                href={imagesTagged[imgIdx]?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm text-[#486284] hover:underline"
              >
                {t("applicationDetail.openImageNewTab")}
              </a>
            </div>
          ) : null}

          {otherUrls.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-2">
                {t("applicationDetail.otherFiles")}
              </h3>
              <ul className="space-y-3">
                {otherUrls.map(({ url, docIndex }) => {
                  const slotLabel = providerDocSlotLabel(docIndex);
                  return (
                    <li key={`${docIndex}-${url}`}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                        {slotLabel}
                      </p>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#486284] hover:underline break-all"
                      >
                        {fileLabelFromUrl(docUrls[docIndex] ?? url)}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t("applicationDetail.documents")}
          </h2>
          <p className="text-sm text-gray-500">{t("applicationDetail.noFiles")}</p>
        </section>
      )}

      {application.status === "pending" ? (
        <div className="space-y-4 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-600">{t("applicationDetail.approveHint")}</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void onApprove()}
              className="min-h-[48px] flex-1 sm:max-w-xs px-6 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50"
            >
              {actionLoading ? t("applicationDetail.working") : t("applicationDetail.approve")}
            </button>
            {!rejectFlowOpen ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setRejectFlowOpen(true);
                  setRejectError("");
                }}
                className="min-h-[48px] flex-1 sm:max-w-xs px-6 rounded-lg border-2 border-red-600 text-red-700 font-semibold hover:bg-red-50 disabled:opacity-50"
              >
                {t("applicationDetail.rejectApplication")}
              </button>
            ) : (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setRejectFlowOpen(false);
                  setRejectError("");
                }}
                className="min-h-[48px] flex-1 sm:max-w-xs px-6 rounded-lg border border-gray-300 text-slate-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                {t("applicationDetail.cancelRejection")}
              </button>
            )}
          </div>
          {rejectFlowOpen ? (
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 space-y-3">
              <label className="block text-sm font-medium text-slate-800">
                {t("applicationDetail.rejectionReasonLabel")}
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder={t("applicationDetail.rejectionPlaceholder")}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm bg-white"
              />
              {rejectError ? (
                <p className="text-sm text-red-600">{rejectError}</p>
              ) : null}
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void onReject()}
                className="min-h-[48px] w-full sm:w-auto px-6 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
              >
                {actionLoading
                  ? t("applicationDetail.working")
                  : t("applicationDetail.rejectApplication")}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          {t("applicationDetail.alreadyFinal", {
            status: applicationStatusLabel(application.status),
          })}
        </p>
      )}
    </div>
  );
}
