"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaTelegram } from "react-icons/fa";
import { ApiError } from "@/lib/api";
import { openTelegramLink } from "@/lib/api/telegram";
import { i18n } from "@/lib/i18n/client";

type ConnectTelegramButtonProps = {
  className?: string;
  variant?: "primary" | "menu";
  onSuccess?: () => void;
};

export default function ConnectTelegramButton({
  className = "",
  variant = "primary",
  onSuccess,
}: ConnectTelegramButtonProps) {
  const { t } = useTranslation("common", { i18n });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setLoading(true);
    setError("");
    try {
      await openTelegramLink();
      onSuccess?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.body.message ??
            err.body.error ??
            t("telegram.linkCreateFailed"),
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("telegram.linkCreateFailedGeneric"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (variant === "menu") {
    return (
      <>
        <button
          type="button"
          role="menuitem"
          disabled={loading}
          onClick={handleClick}
          className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-medium text-[#1E293B] hover:bg-gray-50 transition-colors disabled:opacity-50 ${className}`}
        >
          <FaTelegram
            className="h-5 w-5 shrink-0 text-[#229ED9]"
            aria-hidden
          />
          {loading ? t("telegram.creatingLink") : t("telegram.connect")}
        </button>
        {error ? (
          <p className="px-3.5 pb-1 text-xs text-red-600">{error}</p>
        ) : null}
      </>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        disabled={loading}
        onClick={handleClick}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#229ED9]/30 bg-[#229ED9]/5 px-4 py-2.5 text-sm font-semibold text-[#1E293B] hover:bg-[#229ED9]/10 disabled:opacity-50 transition-colors"
      >
        <FaTelegram className="h-5 w-5 shrink-0 text-[#229ED9]" aria-hidden />
        {loading ? t("telegram.creatingLink") : t("telegram.connect")}
      </button>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
