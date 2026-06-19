import { create } from "zustand";

interface ModalStore {
  modal: React.ReactNode | null;
  openModal: (modal: React.ReactNode) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  modal: null,
  openModal: (modal: React.ReactNode) => set({ modal }),
  closeModal: () => set({ modal: null }),
}));
