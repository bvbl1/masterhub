"use client";

import type { ReactNode } from "react";
import Header from "@/components/common/Header";
import ModalContainer from "@/components/common/ModalContainer";
import AiAssistantMount from "@/components/ai/AiAssistantMount";
import RequireAuth from "@/components/auth/RequireAuth";

export default function FunctionalAppShell({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-[#F8FAFC] max-w-screen overflow-hidden">
        <Header />
        <div>{children}</div>
        <ModalContainer />
        <AiAssistantMount />
      </div>
    </RequireAuth>
  );
}
