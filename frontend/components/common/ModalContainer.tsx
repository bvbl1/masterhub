"use client";

import { useModalStore } from "@/lib/store/modalStore";

export default function ModalContainer() {
  const { modal, closeModal } = useModalStore();

  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />
      <div className="relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {modal}
      </div>
    </div>
  );
}
