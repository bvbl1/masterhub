"use client";

import { useEffect, useState } from "react";
import AiAssistantPanel from "@/components/ai/AiAssistantPanel";
import { AnimatePresence, motion } from "framer-motion";
import { FaRobot } from "react-icons/fa";
import { usePathname } from "next/navigation";

export default function AiAssistantMount() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const path = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (expanded) {
          setExpanded(false);
        } else {
          setOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, expanded]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = expanded ? "hidden" : "";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, expanded]);

  if (path.includes("/chat")) return null;

  const close = () => {
    setOpen(false);
    setExpanded(false);
  };

  return (
    <>
      <AnimatePresence>
        {!open ? (
          <motion.button
            key="ai-fab"
            type="button"
            initial={{ opacity: 0, scale: 0.6, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 12 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#486284] text-white shadow-lg shadow-slate-900/20 ring-1 ring-white/25 transition-colors hover:bg-[#3a5270] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#486284] focus-visible:ring-offset-2 lg:bottom-8 sm:right-6"
            aria-label="Open AI assistant"
            aria-expanded={false}
          >
            <FaRobot className="h-7 w-7 drop-shadow-sm" />
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Close assistant"
              className="fixed inset-0 z-[54] cursor-default bg-slate-900/30 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
            />
            <AiAssistantPanel
              expanded={expanded}
              onToggleExpand={() => setExpanded((v) => !v)}
              onClose={close}
            />
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
