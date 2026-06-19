"use client";

import Link from "next/link";
import type { AiChatResponse, AiDraftJobRequest } from "@/lib/api/aiChat";
import type { Category } from "@/lib/api/types";
import { formatCurrency, formatCurrencyRange } from "@/lib/formatCurrency";

const MISSING_HINTS: Record<string, string> = {
  scheduled_at: "Preferred start date",
  city: "City",
  budget_min: "Minimum budget",
  budget_max: "Maximum budget",
  description: "Description",
};

function intentLabel(intent: string): string {
  const map: Record<string, string> = {
    create_job_request: "Job request draft",
    repair_advice: "Repair advice",
    recommend_providers: "Provider recommendations",
    improve_description: "Description ideas",
    price_estimate: "Price estimate",
    general_question: "General",
  };
  return map[intent] ?? intent;
}

function formatScheduled(isoLike: string): string {
  if (!isoLike?.trim()) return "Not specified";
  const d = new Date(isoLike);
  return Number.isNaN(d.getTime())
    ? isoLike
    : d.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

export interface AIResponseCardProps {
  response: AiChatResponse;
  categories: Category[];
  effectiveCategoryId: string;
  onCategoryChange?: (categoryId: string) => void;
  showCategoryPicker: boolean;
  canSubmitJobRequest: boolean;
  onSubmitJobRequest?: () => void;
  jobSubmitting?: boolean;
  jobSubmitError?: string | null;
}

export default function AIResponseCard({
  response,
  categories,
  effectiveCategoryId,
  onCategoryChange,
  showCategoryPicker,
  canSubmitJobRequest,
  onSubmitJobRequest,
  jobSubmitting = false,
  jobSubmitError,
}: AIResponseCardProps) {
  const draft = response.draftJobRequest;
  const classification = response.classification;
  const price = response.estimatedPrice;

  return (
    <div className="space-y-4 text-left">
      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Reply ·{" "}
          <span className="text-[#486284] normal-case">
            {intentLabel(response.intent)}
          </span>
        </p>
        <p className="mt-1.5 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
          {response.message}
        </p>
      </div>

      {draft ? (
        <section className="rounded-xl border border-[#486284]/25 bg-[#486284]/[0.04] p-4">
          <h3 className="text-sm font-bold text-slate-900">Draft job request</h3>
          <DraftTable draft={draft} />
          {onCategoryChange ? (
            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Category<span className="text-red-500">*</span>
              </label>
              <select
                value={effectiveCategoryId}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#486284] focus:ring-2 focus:ring-[#486284]/20"
              >
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {showCategoryPicker ? (
                <p className="mt-1 text-[11px] text-amber-800 bg-amber-50 rounded-lg px-2 py-1.5">
                  Could not match AI service label to catalog — pick manually.
                </p>
              ) : null}
            </div>
          ) : null}
          <p className="mt-2 text-[11px] text-slate-500">
            Values are indicative; verify before submitting.
          </p>
          {response.missing?.length ? (
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
              <p className="text-xs font-semibold text-amber-900">
                Please clarify
              </p>
              <ul className="mt-1 list-disc list-inside text-xs text-amber-900/90 space-y-0.5">
                {response.missing.map((key) => (
                  <li key={key}>{MISSING_HINTS[key] ?? key}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {onSubmitJobRequest ? (
            <div className="mt-4">
              <button
                type="button"
                disabled={!canSubmitJobRequest || jobSubmitting}
                onClick={onSubmitJobRequest}
                className="w-full rounded-xl bg-[#486284] py-3 text-sm font-semibold text-white hover:bg-[#3a5270] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {jobSubmitting ? "Creating…" : "Create job request"}
              </button>
              {!canSubmitJobRequest ? (
                <p className="mt-2 text-[11px] text-slate-500">
                  Sign in as a customer, choose a category, and ensure required
                  fields (including schedule) before submitting.
                </p>
              ) : null}
              {jobSubmitError ? (
                <p className="mt-2 text-xs text-red-600">{jobSubmitError}</p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {classification ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Classification
          </h3>
          <dl className="mt-2 grid gap-2 text-xs text-slate-700">
            {classification.serviceType ? (
              <div>
                <dt className="text-slate-500">Service type</dt>
                <dd className="font-medium">{classification.serviceType}</dd>
              </div>
            ) : null}
            {classification.urgency ? (
              <div>
                <dt className="text-slate-500">Urgency</dt>
                <dd className="font-medium capitalize">{classification.urgency}</dd>
              </div>
            ) : null}
            {classification.budgetSegment ? (
              <div>
                <dt className="text-slate-500">Budget segment</dt>
                <dd className="font-medium capitalize">
                  {classification.budgetSegment}
                </dd>
              </div>
            ) : null}
            {classification.additionalServices.length ? (
              <div>
                <dt className="text-slate-500">Also mentioned</dt>
                <dd className="font-medium flex flex-wrap gap-1">
                  {classification.additionalServices.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]"
                    >
                      {s}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {price ? (
        <section className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4">
          <h3 className="text-sm font-bold text-emerald-900">
            Estimated range (informative only)
          </h3>
          <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-950">
            {formatCurrencyRange(price.minPrice, price.maxPrice)}
          </p>
          {price.estimatedDays > 0 ? (
            <p className="mt-2 text-xs text-emerald-900/90">
              Approx. timeline:{" "}
              <span className="font-semibold">{price.estimatedDays} days</span>
            </p>
          ) : null}
          {price.comment ? (
            <p className="mt-2 text-xs text-emerald-900/80 leading-relaxed">
              {price.comment}
            </p>
          ) : null}
        </section>
      ) : null}

      {response.repairSteps.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">Suggested steps</h3>
          <ol className="mt-2 space-y-1.5 text-sm text-slate-700 list-decimal list-inside">
            {response.repairSteps.map((step, i) => (
              <li key={i} className="leading-snug pl-1 -indent-1">
                {step}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {response.recommendedProviders.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">
            Recommended providers
          </h3>
          <ul className="mt-3 space-y-3">
            {response.recommendedProviders.map((p) => (
              <li
                key={`${p.id}-${p.fullName}`}
                className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
              >
                <div className="flex justify-between gap-2">
                  <p className="font-semibold text-slate-900 text-sm truncate">
                    {p.fullName || `Provider #${p.id}`}
                  </p>
                  {p.id > 0 ? (
                    <Link
                      href={`/provider/${p.id}`}
                      className="shrink-0 text-xs font-semibold text-[#486284] hover:underline"
                    >
                      Profile
                    </Link>
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {[p.specialty, p.city].filter(Boolean).join(" · ") || "—"}
                  {p.rating > 0 ? ` · ★ ${p.rating}` : ""}
                </p>
                {p.reason ? (
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {p.reason}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function DraftTable({ draft }: { draft: AiDraftJobRequest }) {
  return (
    <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm grid-cols-1 sm:grid-cols-2">
      <div>
        <dt className="text-xs text-slate-500">City</dt>
        <dd className="font-medium text-slate-900">{draft.city || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-slate-500">Service</dt>
        <dd className="font-medium text-slate-900">
          {draft.serviceType || "—"}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs text-slate-500">Description</dt>
        <dd className="font-medium text-slate-900 mt-0.5 whitespace-pre-wrap">
          {draft.description || "—"}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-slate-500">Budget</dt>
        <dd className="font-medium tabular-nums">
          {draft.budgetMin > 0 || draft.budgetMax > 0 ? (
            <>
              {formatCurrencyRange(draft.budgetMin, draft.budgetMax)}
            </>
          ) : (
            "—"
          )}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-slate-500">Schedule</dt>
        <dd className="font-medium">{formatScheduled(draft.scheduledAt)}</dd>
      </div>
    </dl>
  );
}
