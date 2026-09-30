"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import LegalDocumentView from "@/components/marketing/legal-document";
import type { LegalDocument } from "@/lib/legal";

export default function LegalModal({ doc, onClose }: { doc: LegalDocument | null; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  // Remember what opened the dialog before autoFocus moves focus into it.
  if (doc && !opener && typeof document !== "undefined") setOpener(document.activeElement as HTMLElement | null);
  if (!doc && opener) {
    setOpener(null);
    setTimeout(() => opener.focus(), 0);
  }

  useEffect(() => {
    if (!doc) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>("button, [href], input, select, textarea");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [doc, onClose]);

  if (!doc) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-overlay flex items-center justify-center bg-ink/40 px-4 py-8"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-[6px] bg-paper border border-line"
      >
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div id="legal-modal-title">
            <LegalDocumentView doc={doc} compact />
          </div>
        </div>
        <div className="flex justify-end border-t border-line px-6 py-4">
          <Button variant="inverse" size="sm" onClick={onClose} autoFocus>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
