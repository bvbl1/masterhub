import AuthLayoutShell from "@/components/authorization/AuthLayoutShell";

export default function AuthCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayoutShell>{children}</AuthLayoutShell>;
}
