"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/api";
import { useAuth } from "@/lib/context/AuthContext";
import { useAuthTranslation } from "@/lib/i18n/useAuthTranslation";

function AuthCallbackInner() {
  const { t } = useAuthTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [status, setStatus] = useState<"processing" | "error">("processing");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const token = searchParams.get("token");
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const oauthError =
        searchParams.get("oauth_error") ?? searchParams.get("error");

      if (oauthError) {
        if (!cancelled) setStatus("error");
        router.replace(`/login?oauth_error=${encodeURIComponent("google_cancelled")}`);
        return;
      }

      // Старый флоу — gateway уже вернул token
      if (token?.trim()) {
        setToken(token.trim(), true);
        await refresh();
        if (!cancelled) router.replace("/dashboard");
        return;
      }

      // Новый флоу — Google вернул code, обмениваем на token через gateway
      if (code?.trim()) {
        try {
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/v1";
          const res = await fetch(`${apiUrl}/auth/google/exchange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, state }),
          });

          if (!res.ok) throw new Error("exchange failed");

          const data = (await res.json()) as { token?: string };
          if (!data.token) throw new Error("no token in response");

          setToken(data.token, true);
          await refresh();
          if (!cancelled) router.replace("/dashboard");
        } catch {
          if (!cancelled) setStatus("error");
          router.replace(
            `/login?oauth_error=${encodeURIComponent("exchange_failed")}`,
          );
        }
        return;
      }

      if (!cancelled) setStatus("error");
      router.replace(`/login?oauth_error=${encodeURIComponent("no_token")}`);
    }

    void finish();

    return () => {
      cancelled = true;
    };
  }, [searchParams, refresh, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-gray-700">
      {status === "processing" ? (
        <p className="text-sm font-medium">{t("callback.signingIn")}</p>
      ) : (
        <p className="text-sm font-medium text-red-600">
          {t("callback.redirectLogin")}
        </p>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  const { t } = useAuthTranslation();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-gray-700">
          <p className="text-sm font-medium">{t("callback.loading")}</p>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
