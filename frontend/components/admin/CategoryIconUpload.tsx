"use client";

import { useEffect, useId, useState, type ChangeEvent } from "react";
import { HiOutlinePhotograph } from "react-icons/hi";
import { CategoryIconDisplay, isCategoryIconUrl } from "@/lib/categoryIcons";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type Props = {
  iconUrl: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
};

export default function CategoryIconUpload({
  iconUrl,
  file,
  onFileChange,
  disabled = false,
}: Props) {
  const { t } = useAdminTranslation();
  const inputId = useId();
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const displayUrl = preview ?? (isCategoryIconUrl(iconUrl) ? iconUrl : null);

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    onFileChange(picked ?? null);
  };

  return (
    <div>
      <span className="text-xs font-medium text-slate-600">
        {t("categories.icon")}
      </span>
      <p className="text-xs text-slate-500 mt-0.5 mb-2">{t("categories.iconUploadHint")}</p>

      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <CategoryIconDisplay icon={iconUrl} className="h-8 w-8 text-slate-400" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            disabled={disabled}
            onChange={onPick}
          />
          <label
            htmlFor={inputId}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${
              disabled ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <HiOutlinePhotograph className="h-5 w-5 text-[#486284]" aria-hidden />
            {file ? t("categories.iconChangeFile") : t("categories.iconChooseFile")}
          </label>
          {file ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onFileChange(null)}
              className="text-left text-xs text-slate-500 hover:text-slate-800 disabled:opacity-50"
            >
              {t("categories.iconClearFile")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
