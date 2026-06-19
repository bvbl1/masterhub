"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiMaximize2, FiMinimize2, FiSend } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";
import { IoMdClose } from "react-icons/io";
import { MdOutlineTipsAndUpdates } from "react-icons/md";
import { useAuth } from "@/lib/context/AuthContext";
import AIResponseCard from "@/components/ai/AIResponseCard";
import { ApiError, categoriesApi, jobRequestsApi } from "@/lib/api";
import type { AiChatResponse, AiDraftJobRequest } from "@/lib/api/aiChat";
import { draftToRequestContext, postAiChat } from "@/lib/api/aiChat";
import type { Category } from "@/lib/api/types";
import { bestCategoryMatch } from "@/lib/ai/categoryMatch";

type Turn =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; structured?: AiChatResponse };

type AiAssistantPanelProps = {
  onClose: () => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
};

/** AI assistant drawer — compact corner or expanded overlay. */
export default function AiAssistantPanel({
  onClose,
  expanded = false,
  onToggleExpand,
}: AiAssistantPanelProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryOverrides, setCategoryOverrides] = useState<
    Record<number, string>
  >({});
  const [jobSubmittingIdx, setJobSubmittingIdx] = useState<number | null>(null);
  const [jobErrorByIdx, setJobErrorByIdx] = useState<Record<number, string>>(
    {},
  );
  const lastContextRef = useRef<AiDraftJobRequest | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    categoriesApi.getCategories().then((r) => setCategories(r.categories));
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns, sending]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    const ctxDraft = lastContextRef.current;

    const userTurn: Turn = { role: "user", text: trimmed };
    setTurns((t) => [...t, userTurn]);
    setInput("");
    setSending(true);
    try {
      const payloadCtx = ctxDraft && draftToRequestContext(ctxDraft);
      const structured = await postAiChat(
        trimmed,
        payloadCtx &&
          Object.values(payloadCtx).some((v) => v !== undefined && v !== "")
          ? payloadCtx
          : undefined,
      );
      lastContextRef.current =
        structured.draftJobRequest ?? lastContextRef.current;

      setTurns((prev) => {
        const assistantIndex = prev.length;
        const match = structured.draftJobRequest
          ? bestCategoryMatch(
              categories,
              structured.draftJobRequest.serviceType,
              structured.classification?.serviceType,
            )
          : null;
        if (match) {
          setCategoryOverrides((o) => ({
            ...o,
            [assistantIndex]: String(match!.id),
          }));
        }

        const assist: Turn = {
          role: "assistant",
          text: structured.message,
          structured,
        };
        return [...prev, assist];
      });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not reach the assistant.";
      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          text: msg,
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, sending, categories]);

  const deriveTitle = (draft: AiDraftJobRequest): string => {
    const raw = draft.serviceType.trim() || draft.description.trim();
    if (!raw) return "Job request";
    const line = raw.split("\n")[0]?.trim() ?? raw;
    return line.length > 120 ? `${line.slice(0, 117)}…` : line;
  };

  const handleCreateJob = useCallback(
    async (assistIndex: number, structured: AiChatResponse) => {
      const draft = structured.draftJobRequest;
      if (!draft || user?.role !== "customer") return;

      let categoryId = categoryOverrides[assistIndex] ?? "";

      const match =
        categories.length > 0
          ? bestCategoryMatch(
              categories,
              draft.serviceType,
              structured.classification?.serviceType,
            )
          : null;
      if (!categoryId.trim() && match) {
        categoryId = String(match.id);
      }

      const catNum = Number(categoryId);
      if (!Number.isFinite(catNum) || catNum <= 0) {
        setJobErrorByIdx((e) => ({
          ...e,
          [assistIndex]: "Pick a catalog category.",
        }));
        return;
      }

      if (!draft.city.trim()) {
        setJobErrorByIdx((e) => ({
          ...e,
          [assistIndex]:
            "City is missing from the draft — clarify in chat or create the request manually.",
        }));
        return;
      }

      let scheduled = draft.scheduledAt.trim();
      if (!scheduled) {
        setJobErrorByIdx((e) => ({
          ...e,
          [assistIndex]:
            "Add a preferred start date in the conversation, then try again—or create the job request manually.",
        }));
        return;
      }

      if (!scheduled.includes("T")) scheduled = `${scheduled}T12:00:00`;
      const sd = new Date(scheduled);
      if (Number.isNaN(sd.getTime())) {
        setJobErrorByIdx((e) => ({
          ...e,
          [assistIndex]:
            "Cannot parse schedule from assistant. Mention a clearer date.",
        }));
        return;
      }
      const scheduled_at = sd.toISOString();

      let min = draft.budgetMin > 0 ? draft.budgetMin : 0;
      let max = draft.budgetMax > 0 ? draft.budgetMax : 0;
      if ((!min || !max) && structured.estimatedPrice) {
        if (!min && structured.estimatedPrice.minPrice > 0) {
          min = structured.estimatedPrice.minPrice;
        }
        if (!max && structured.estimatedPrice.maxPrice > 0) {
          max = structured.estimatedPrice.maxPrice;
        }
      }
      if (!(min > 0) || !(max > 0)) {
        setJobErrorByIdx((e) => ({
          ...e,
          [assistIndex]: "Set a budget range in chat or refine the draft.",
        }));
        return;
      }
      if (min > max) {
        const t = min;
        min = max;
        max = t;
      }

      const title = deriveTitle(draft);
      const description =
        draft.description.trim() ||
        `${draft.serviceType}. ${structured.message.slice(0, 400)}`.trim();

      setJobSubmittingIdx(assistIndex);
      setJobErrorByIdx((e) => ({ ...e, [assistIndex]: "" }));
      try {
        const jr = await jobRequestsApi.createJobRequest({
          category_id: catNum,
          title,
          description,
          city: draft.city.trim(),
          budget_min: min,
          budget_max: max,
          scheduled_at,
        });
        onClose();
        router.push(`/requests/${jr.id}`);
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? (err.body.message ?? err.body.error ?? "Could not create request")
            : "Could not create request.";
        setJobErrorByIdx((e) => ({ ...e, [assistIndex]: msg }));
      } finally {
        setJobSubmittingIdx(null);
      }
    },
    [user?.role, categoryOverrides, categories, router, onClose],
  );

  const buildCardPropsForIndex = useCallback(
    (index: number, structured: AiChatResponse) => {
      const draft = structured.draftJobRequest;
      const match =
        categories.length && draft
          ? bestCategoryMatch(
              categories,
              draft.serviceType,
              structured.classification?.serviceType,
            )
          : null;

      const effectiveCategoryId =
        categoryOverrides[index] ?? (match ? String(match.id) : "");

      const showCategoryPicker = Boolean(!match && draft);

      const parsedSchedule = draft?.scheduledAt?.trim()
        ? new Date(
            draft.scheduledAt.includes("T")
              ? draft.scheduledAt
              : `${draft.scheduledAt}T12:00:00`,
          )
        : null;
      const scheduledOk =
        Boolean(parsedSchedule) && !Number.isNaN(parsedSchedule!.getTime());

      const budgetsOk =
        !!draft &&
        ((draft.budgetMin > 0 &&
          draft.budgetMax > 0 &&
          draft.budgetMin <= draft.budgetMax) ||
          (structured.estimatedPrice &&
            structured.estimatedPrice.minPrice > 0 &&
            structured.estimatedPrice.maxPrice > 0 &&
            structured.estimatedPrice.minPrice <=
              structured.estimatedPrice.maxPrice));

      const canSubmit =
        user?.role === "customer" &&
        Boolean(draft) &&
        Boolean(draft!.city.trim()) &&
        budgetsOk &&
        scheduledOk &&
        Number.isFinite(Number(effectiveCategoryId)) &&
        Number(effectiveCategoryId) > 0;

      return {
        response: structured,
        categories,
        effectiveCategoryId,
        showCategoryPicker,
        canSubmitJobRequest: Boolean(canSubmit),
        onCategoryChange:
          draft && user?.role === "customer"
            ? (id: string) =>
                setCategoryOverrides((o) => ({ ...o, [index]: id }))
            : undefined,
        onSubmitJobRequest:
          draft && user?.role === "customer"
            ? () => void handleCreateJob(index, structured)
            : undefined,
        jobSubmitting: jobSubmittingIdx === index,
        jobSubmitError: jobErrorByIdx[index] ?? null,
      };
    },
    [
      categories,
      categoryOverrides,
      user?.role,
      handleCreateJob,
      jobSubmittingIdx,
      jobErrorByIdx,
    ],
  );

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-assistant-title"
      layout
      initial={{ opacity: 0, y: 28, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={`fixed z-[55] flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl ring-1 ring-black/5 ${
        expanded
          ? "top-3 bottom-3 left-3 right-3 sm:top-6 sm:bottom-6 sm:left-6 sm:right-6 md:left-[max(0.75rem,calc(50%-32rem))] md:right-[max(0.75rem,calc(50%-32rem))] w-auto max-w-4xl max-h-[calc(100dvh-1.5rem)] min-h-[min(520px,82dvh)]"
          : "bottom-4 right-4 sm:bottom-8 sm:right-6 w-[calc(100vw-1.5rem)] max-w-[420px] max-h-[min(560px,calc(100dvh-7rem))] min-h-[min(380px,calc(100dvh-7rem))]"
      }`}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-[#486284]/[0.07] via-white to-white px-3.5 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#486284] text-white shadow-inner">
          <HiOutlineSparkles className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p
            id="ai-assistant-title"
            className="truncate text-sm font-bold tracking-tight text-slate-900"
          >
            AI assistant
          </p>
          <p className="truncate text-[11px] text-slate-500 leading-snug">
            {expanded
              ? "Expanded view · draft jobs & estimates"
              : "Draft jobs, estimates & next steps"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {onToggleExpand ? (
            <button
              type="button"
              onClick={onToggleExpand}
              className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#486284]/40"
              aria-label={expanded ? "Compact window" : "Expand window"}
            >
              {expanded ? (
                <FiMinimize2 className="h-5 w-5" aria-hidden />
              ) : (
                <FiMaximize2 className="h-5 w-5" aria-hidden />
              )}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#486284]/40"
            aria-label="Close assistant"
          >
            <IoMdClose className="h-6 w-6" aria-hidden />
          </button>
        </div>
      </div>

      {!user ? (
        <div className="flex shrink-0 items-start gap-2 border-b border-amber-100/90 bg-amber-50 px-3.5 py-2.5">
          <MdOutlineTipsAndUpdates
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
            aria-hidden
          />
          <p className="text-xs text-amber-900 leading-snug">
            Sign in to send messages and create job drafts from AI suggestions.
          </p>
        </div>
      ) : null}

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3.5 py-3"
      >
        {turns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/90 px-3 py-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <MdOutlineTipsAndUpdates
                className="h-3.5 w-3.5 text-[#486284]"
                aria-hidden
              />
              Examples
            </p>
            <ul className="mt-2 space-y-2 text-[11px] text-slate-600 leading-relaxed">
              <li className="pl-4 -indent-2">
                Bathroom renovation in Astana, turnkey, budget around 1M.
              </li>
              <li className="pl-4 -indent-2">
                Wiring and outlets in Almaty, budget ~300k — trade order?
              </li>
            </ul>
          </div>
        ) : null}

        {turns.map((t, i) => {
          if (t.role === "user") {
            return (
              <div key={`u-${i}`} className="flex justify-end">
                <div className="max-w-[94%] rounded-2xl bg-[#486284] px-3.5 py-2 text-sm leading-snug text-white shadow-sm whitespace-pre-wrap">
                  {t.text}
                </div>
              </div>
            );
          }

          const structured = t.structured;
          const props = structured
            ? buildCardPropsForIndex(i, structured)
            : null;

          return (
            <div key={`a-${i}`} className="flex justify-start gap-2">
              <div
                className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#486284]/15 text-[#486284]"
                aria-hidden
              >
                <HiOutlineSparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 max-w-[min(100%,22rem)] flex-1 rounded-2xl border border-slate-100 bg-slate-50/95 px-2.5 py-2 shadow-sm ring-1 ring-slate-100/80">
                {props && structured ? (
                  <AIResponseCard {...props} />
                ) : (
                  <p className="text-sm text-slate-800 whitespace-pre-wrap leading-snug">
                    {t.text}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 p-3">
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              user ? "Describe your project…" : "Sign in to use the assistant"
            }
            disabled={sending || !user}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            className="h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-[#486284]/60 focus:ring-2 focus:ring-[#486284]/15 disabled:bg-slate-50"
          />
          <button
            type="button"
            disabled={sending || !input.trim() || !user}
            onClick={() => void sendMessage()}
            className="flex h-[44px] w-11 shrink-0 items-center justify-center rounded-xl bg-[#486284] text-white shadow-sm transition hover:bg-[#3a5270] disabled:opacity-40 disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#486284]/50 focus-visible:ring-offset-1"
            aria-label="Send message"
          >
            {sending ? (
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                aria-hidden
              />
            ) : (
              <FiSend className="h-[18px] w-[18px] -translate-x-px translate-y-[1px]" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
