import type { ReactNode } from "react";
import AuthLayoutShell from "@/components/authorization/AuthLayoutShell";
import RequireGuest from "@/components/auth/RequireGuest";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <RequireGuest>
      <AuthLayoutShell>{children}</AuthLayoutShell>
    </RequireGuest>
  );
}
