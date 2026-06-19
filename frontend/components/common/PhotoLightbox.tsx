"use client";

import Image from "next/image";
import { useCallback, useEffect } from "react";

export type PhotoLightboxProps = {
  urls: string[];
  /** `null` = closed */
  index: number | null;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
};

export default function PhotoLightbox({
  urls,
  index,
  onClose,
  onIndexChange,
}: PhotoLightboxProps) {
  const open =
    index !== null && index >= 0 && index < urls.length && Boolean(urls[index]);
  const url = open ? urls[index!] : "";
  const hasNav = urls.length > 1 && onIndexChange;

  const go = useCallback(
    (delta: number) => {
      if (!open || index === null || !onIndexChange) return;
      const next = (index + delta + urls.length) % urls.length;
      onIndexChange(next);
    },
    [open, index, urls.length, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasNav) go(-1);
      if (e.key === "ArrowRight" && hasNav) go(1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, go, hasNav]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Photo preview"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
        aria-label="Close"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {hasNav ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20 sm:left-4"
            aria-label="Previous photo"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20 sm:right-4"
            aria-label="Next photo"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </>
      ) : null}

      <div
        className="relative flex max-h-[90vh] max-w-[min(92vw,1200px)] flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={url}
          alt=""
          width={1200}
          height={900}
          className="max-h-[85vh] w-auto max-w-full object-contain"
          unoptimized
          priority
        />
        {urls.length > 1 && index !== null ? (
          <p className="mt-3 text-sm text-white/70">
            {index + 1} / {urls.length}
          </p>
        ) : null}
      </div>
    </div>
  );
}
