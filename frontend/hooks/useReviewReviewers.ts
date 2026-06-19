"use client";

import { useEffect, useMemo, useState } from "react";
import { authApi, type Review, type User } from "@/lib/api";

export type ReviewerEntry =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; user: User };

export function useReviewReviewers(reviews: Review[]): Record<string, ReviewerEntry> {
  const [reviewers, setReviewers] = useState<Record<string, ReviewerEntry>>({});

  const reviewerIdsKey = useMemo(() => {
    const ids = reviews
      .map((r) => r.reviewerId?.trim())
      .filter((id): id is string => Boolean(id));
    return [...new Set(ids)].sort().join(",");
  }, [reviews]);

  useEffect(() => {
    const ids = reviewerIdsKey ? reviewerIdsKey.split(",") : [];
    if (ids.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReviewers({});
      return;
    }

    let cancelled = false;
    setReviewers((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        if (!next[id] || next[id].status === "error") {
          next[id] = { status: "loading" };
        }
      }
      return next;
    });

    void Promise.all(
      ids.map(async (id) => {
        try {
          const { user } = await authApi.getUserById(id);
          return { id, entry: { status: "ok" as const, user } };
        } catch {
          return { id, entry: { status: "error" as const } };
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      setReviewers((prev) => {
        const next = { ...prev };
        for (const { id, entry } of results) {
          next[id] = entry;
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [reviewerIdsKey]);

  return reviewers;
}
