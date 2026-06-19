"use client";

import {
  useEffect,
  useId,
  useState,
  type ChangeEvent,
} from "react";
import { HiOutlinePhotograph } from "react-icons/hi";

type PhotoUploadFieldProps = {
  label?: string;
  hint?: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
};

export default function PhotoUploadField({
  label = "Photos (optional)",
  hint = "JPEG or PNG, up to a few images",
  files,
  onFilesChange,
  maxFiles = 6,
  disabled = false,
}: PhotoUploadFieldProps) {
  const inputId = useId();
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (files.length === 0) {
      setPreviews([]);
      return;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, [files]);

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;
    onFilesChange(
      [...files, ...picked].slice(0, maxFiles),
    );
  };

  const removeAt = (idx: number) => {
    onFilesChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {previews.map((src, index) => (
          <div
            key={`${files[index]?.name ?? "p"}-${files[index]?.lastModified ?? index}`}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label="Remove photo"
              disabled={disabled}
              onClick={() => removeAt(index)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-xs text-white hover:bg-black/70 disabled:opacity-50"
            >
              ×
            </button>
          </div>
        ))}
        {files.length < maxFiles ? (
          <>
            <input
              id={inputId}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={disabled}
              onChange={onPick}
            />
            <label
              htmlFor={inputId}
              className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400 transition hover:border-[#486284]/40 hover:bg-slate-50 hover:text-[#486284] ${
                disabled ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <HiOutlinePhotograph className="size-7" aria-hidden />
              <span className="mt-1 text-[10px] font-medium">Add</span>
            </label>
          </>
        ) : null}
      </div>
    </div>
  );
}
