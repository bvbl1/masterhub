import type { ReactNode } from "react";
import FunctionalAppShell from "@/components/auth/FunctionalAppShell";

export default function FunctionalLayOut({ children }: { children: ReactNode }) {
  return <FunctionalAppShell>{children}</FunctionalAppShell>;
}
