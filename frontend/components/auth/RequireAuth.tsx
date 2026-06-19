"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { getToken } from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div
        className="h-9 w-9 rounded-full border-2 border-[#486284]/25 border-t-[#486284] animate-spin"
        aria-hidden
      />
    </div>
  );
}

/** Redirects to /login when there is no valid session. */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (user) return;
    if (getToken()) return;

    const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`/login${next}`);
  }, [loading, user, router, pathname]);

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user && !getToken()) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}
