"use client";

import { useState } from "react";
import { FiTool } from "react-icons/fi";

/** Старые id из react-icons picker, не URL картинки. */
function isLegacyReactIconsId(value: string): boolean {
  return /^[a-z][a-z0-9]*:[A-Za-z0-9]+$/i.test(value);
}

export function isCategoryIconUrl(icon?: string): boolean {
  const s = icon?.trim() ?? "";
  if (!s) return false;
  if (isLegacyReactIconsId(s)) return false;
  if (/^https?:\/\//i.test(s) || s.startsWith("//")) return true;
  if (s.startsWith("/")) return true;
  if (/\.(png|jpe?g|webp|gif|svg|ico)(\?|#|$)/i.test(s)) return true;
  return false;
}

/** Публичный URL MinIO/CDN (как MINIO_PUBLIC_HOST на бэке). */
function resolveCategoryIconSrc(icon: string): string {
  const s = icon.trim();
  if (s.startsWith("//")) return `https:${s}`;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) {
    const base =
      process.env.NEXT_PUBLIC_MEDIA_PUBLIC_URL?.replace(/\/$/, "") ??
      "http://localhost:9000";
    return `${base}${s}`;
  }
  return s.startsWith("http") ? s : `https://${s}`;
}

function CategoryIconImage({
  src,
  className,
  imgSize,
}: {
  src: string;
  className: string;
  imgSize: number;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <FiTool className={className} aria-hidden />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- произвольные media URL (localhost, Railway, MinIO)
    <img
      src={src}
      alt=""
      width={imgSize}
      height={imgSize}
      className={`object-cover rounded shrink-0 ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

/** Показ icon из media URL (поле category.icon в API). */
export function CategoryIconDisplay({
  icon,
  className = "h-7 w-7",
  imgSize = 34,
}: {
  icon?: string;
  className?: string;
  imgSize?: number;
}) {
  const value = icon?.trim();
  const src = value && isCategoryIconUrl(value) ? resolveCategoryIconSrc(value) : null;

  if (!src) {
    return <FiTool className={className} aria-hidden />;
  }

  return (
    <CategoryIconImage
      key={src}
      src={src}
      className={className}
      imgSize={imgSize}
    />
  );
}
