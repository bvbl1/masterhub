"use client";

import { useCallback, useEffect, useState } from "react";
import { useModalStore } from "@/lib/store/modalStore";
import { useAuth } from "@/lib/context/AuthContext";
import {
  ApiError,
  authApi,
  mediaApi,
  providerApplicationApi,
  type ProviderApplication,
} from "@/lib/api";
import { PROVIDER_DOC_SLOT_LABELS } from "@/lib/providerApplicationDocSlots";

const MEDIA_CONTEXT_PROVIDER_DOCS = "provider_documents";

const DOC_SLOTS: {
  key: string;
  label: string;
  hint: string;
  required: boolean;
}[] = [
  {
    key: "government_id",
    label: PROVIDER_DOC_SLOT_LABELS[0],
    hint: "Passport or national ID (image or PDF).",
    required: true,
  },
  {
    key: "qualifications",
    label: PROVIDER_DOC_SLOT_LABELS[1],
    hint: "Diploma, professional license, or certificate.",
    required: true,
  },
  {
    key: "cv",
    label: PROVIDER_DOC_SLOT_LABELS[2],
    hint: "Résumé or portfolio overview (image or PDF).",
    required: true,
  },
  {
    key: "additional",
    label: PROVIDER_DOC_SLOT_LABELS[3],
    hint: "Optional: extra certificate, reference letter, etc.",
    required: false,
  },
];

function statusLabel(status: ProviderApplication["status"]): string {
  switch (status) {
    case "pending":
      return "Under review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

export default function ProviderBecomeModal() {
  const { closeModal } = useModalStore();
  const { refresh, user } = useAuth();
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState("");
  const [application, setApplication] = useState<ProviderApplication | null>(
    null,
  );
  const [filesByKey, setFilesByKey] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [viewableDocUrls, setViewableDocUrls] = useState<string[]>([]);

  const loadApplication = useCallback(async () => {
    setInitLoading(true);
    setInitError("");
    try {
      const app = await providerApplicationApi.getMyProviderApplication();
      setApplication(app);
    } catch {
      setInitError("Could not load your application status. Please try again.");
    } finally {
      setInitLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  useEffect(() => {
    if (application?.status === "approved") {
      void refresh();
    }
  }, [application?.status, refresh]);

  useEffect(() => {
    const urls = application?.documentUrls ?? [];
    if (urls.length === 0) {
      setViewableDocUrls([]);
      return;
    }
    let cancelled = false;
    void mediaApi
      .resolveProviderDocumentViewUrls(urls, {
        ownerUserId: application?.userId,
      })
      .then((resolved) => {
        if (!cancelled) setViewableDocUrls(resolved);
      })
      .catch(() => {
        if (!cancelled) setViewableDocUrls(urls);
      });
    return () => {
      cancelled = true;
    };
  }, [application?.documentUrls?.join("|"), application?.userId]);

  const handleFileChange = (key: string, file: File | null) => {
    setFilesByKey((prev) => ({ ...prev, [key]: file }));
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    const orderedFiles: File[] = [];
    for (const slot of DOC_SLOTS) {
      if (!slot.required) continue;
      const f = filesByKey[slot.key];
      if (!f) {
        setError(`Please attach: ${slot.label}.`);
        return;
      }
      orderedFiles.push(f);
    }
    const extra = filesByKey.additional;
    if (extra) orderedFiles.push(extra);

    setSubmitting(true);
    try {
      const uploaded = await mediaApi.uploadBatch(
        orderedFiles,
        MEDIA_CONTEXT_PROVIDER_DOCS,
      );
      if (uploaded.length < orderedFiles.length) {
        setError("Some files failed to upload. Please try again.");
        return;
      }
      const urls = uploaded.map((item) =>
        mediaApi.tagProviderDocumentUrl(item.url, item.mediaId),
      );
      const created = await providerApplicationApi.submitProviderApplication(urls);
      setApplication(created);
      setFilesByKey({});
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.body.message ?? err.body.error ?? "Failed to submit application",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (initLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl w-[440px] max-w-[90vw] p-10 flex flex-col items-center justify-center gap-3">
        <svg
          className="animate-spin h-8 w-8 text-[#486284]"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
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
        <p className="text-sm text-gray-500">Loading your application…</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl w-[440px] max-w-[90vw] p-8 text-center">
        <p className="text-sm text-red-700 mb-4">{initError}</p>
        <button
          type="button"
          onClick={() => void loadApplication()}
          className="py-2.5 px-4 text-sm font-semibold text-white bg-[#486284] hover:bg-[#3a5270] rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (user?.role === "provider" || application?.status === "approved") {
    return (
      <div className="bg-white rounded-2xl shadow-2xl w-[440px] max-w-[90vw] p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-50 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17L4 12"
              stroke="#22C55E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          You&apos;re now a Provider!
        </h2>
        <p className="text-sm text-gray-500">
          You can now create services and receive orders from customers.
        </p>
      </div>
    );
  }

  if (application?.status === "pending") {
    return (
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-w-[90vw] overflow-hidden">
        <div className="bg-gradient-to-r from-[#486284] to-[#3a5270] px-8 pt-8 pb-6">
          <h2 className="text-xl font-bold text-white">Provider application</h2>
          <p className="text-sm text-white/80 mt-1">
            {statusLabel(application.status)}
          </p>
        </div>
        <div className="px-8 py-6">
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            We received your documents. An administrator will review your
            application. You&apos;ll be able to publish services once approved.
          </p>
          {application.documentUrls.length > 0 ? (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Submitted files
              </p>
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {application.documentUrls.map((url, index) => (
                  <li key={url}>
                    <a
                      href={viewableDocUrls[index] ?? url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#486284] hover:underline break-all"
                    >
                      {url.split("/").pop()?.split("?")[0] ?? url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="text-xs text-gray-400">
            Submitted {application.createdAt ? new Date(application.createdAt).toLocaleString() : ""}
          </p>
          <button
            type="button"
            onClick={closeModal}
            className="mt-6 w-full py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const rejected = application?.status === "rejected";

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-w-[90vw] overflow-hidden max-h-[90vh] flex flex-col">
      <div className="bg-gradient-to-r from-[#486284] to-[#3a5270] px-8 pt-8 pb-6 shrink-0">
        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 15l-2 5l9-11h-5l2-5l-9 11h5z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Become a Provider</h2>
        <p className="text-sm text-white/70 mt-1">
          Upload verification documents for review
        </p>
      </div>

      <div className="px-8 py-6 overflow-y-auto flex-1">
        {rejected && application ? (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-5">
            <p className="text-xs font-semibold text-red-800 mb-1">
              Previous application was rejected
            </p>
            {application.rejectionReason ? (
              <p className="text-sm text-red-700">{application.rejectionReason}</p>
            ) : (
              <p className="text-sm text-red-700">
                Please upload clearer or updated documents and submit again.
              </p>
            )}
          </div>
        ) : null}

        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          After approval by our team, your account will be upgraded to provider.
          Files are uploaded securely and stored for verification only.
        </p>

        <ul className="space-y-4 mb-5">
          {DOC_SLOTS.map((slot) => (
            <li key={slot.key}>
              <label className="block text-sm font-medium text-gray-800">
                {slot.label}
                {!slot.required ? (
                  <span className="text-gray-400 font-normal"> (optional)</span>
                ) : null}
              </label>
              <p className="text-xs text-gray-500 mt-0.5 mb-1.5">{slot.hint}</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-[#486284]/10 file:text-[#486284] hover:file:bg-[#486284]/20"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  handleFileChange(slot.key, f);
                }}
              />
            </li>
          ))}
        </ul>

        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-5">
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Note:</span> You need three required
            documents (ID, qualifications, CV). A fourth file is optional. Your
            role changes only after an administrator approves this application.
          </p>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={closeModal}
            disabled={submitting}
            className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-[#486284] hover:bg-[#3a5270] disabled:bg-[#486284]/40 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
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
                Submitting…
              </>
            ) : (
              "Submit application"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
