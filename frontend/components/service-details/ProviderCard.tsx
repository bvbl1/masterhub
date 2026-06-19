import { authApi, User } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";
interface ProviderCardProps {
  providerId: string;
}

export default function ProviderCard({ providerId }: ProviderCardProps) {
  const { t } = useTranslation("common", { i18n });
  const [info, setInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    setInfo(null);
    authApi
      .getProviderInfo(providerId)
      .then((u) => {
        if (!cancelled) setInfo(u.user);
      })
      .catch(() => {
        if (!cancelled) setError(t("serviceDetail.providerLoadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [providerId]);

  const initials =
    info != null
      ? `${info.firstName?.trim().charAt(0) ?? ""}${info.secondName?.trim().charAt(0) ?? ""}`.toUpperCase() ||
        "?"
      : "?";

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t("serviceDetail.aboutProvider")}
      </h3>

      {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}
      {loading && !info ? (
        <p className="text-sm text-gray-500 mb-4">{t("serviceDetail.loading")}</p>
      ) : null}

      <div className={`flex items-start gap-4 ${loading ? "opacity-70" : ""}`}>
        <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2 ring-white shadow-sm bg-[#486284]/10 flex items-center justify-center text-[#486284] font-bold text-lg">
          {info?.avatarUrl ? (
            <Image
              src={info.avatarUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            initials
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900">
            {info
              ? `${info.firstName} ${info.secondName}`.trim()
              : t("serviceDetail.provider")}
          </h4>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            {t("serviceDetail.providerBio")}
          </p>
        </div>
      </div>

      <Link href={`/provider/${providerId}`}>
        <button className="mt-4 w-full py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
          {t("serviceDetail.viewProfile")}
        </button>
      </Link>
    </div>
  );
}
