"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

function AuthLoadingScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#f4f6f9]">
      <div
        className="h-9 w-9 rounded-full border-2 border-[#486284]/25 border-t-[#486284] animate-spin"
        aria-hidden
      />
    </div>
  );
}

/** Redirects authenticated users away from login/register. */
export default function RequireGuest({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    router.replace("/dashboard");
  }, [loading, user, router]);

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}
