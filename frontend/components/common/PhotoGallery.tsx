"use client";

import Image from "next/image";
import { useState } from "react";
import PhotoLightbox from "@/components/common/PhotoLightbox";

type PhotoGalleryProps = {
  urls: string[] | undefined;
  title?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "h-16 w-16",
  md: "h-24 w-24",
  lg: "h-32 w-32 sm:h-36 sm:w-36",
};

export default function PhotoGallery({
  urls,
  title,
  size = "md",
  className = "",
}: PhotoGalleryProps) {
  const list = (urls ?? []).filter(Boolean);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (list.length === 0) return null;

  return (
    <div className={className}>
      {title ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          {title}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {list.map((href, i) => (
          <button
            key={`${href}-${i}`}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className={`relative block shrink-0 cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 bg-slate-50 outline-none ring-[#486284]/30 transition hover:opacity-90 focus-visible:ring-2 ${sizeMap[size]}`}
            aria-label={`Open photo ${i + 1}`}
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
    </div>
  );
}
