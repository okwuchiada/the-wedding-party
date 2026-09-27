"use client";

import { useEffect } from "react";
import LegalDocumentView from "@/components/marketing/legal-document";
import type { LegalDocument } from "@/lib/legal";

export default function LegalModal({ doc, onClose }: { doc: LegalDocument | null; onClose: () => void }) {
  useEffect(() => {
    if (!doc) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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
      className="fixed inset-0 z-100 flex items-center justify-center bg-(--m-ink)/40 px-4 py-8"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-[6px] bg-(--m-paper) border border-(--m-mist)"
      >
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div id="legal-modal-title">
            <LegalDocumentView doc={doc} compact />
          </div>
        </div>
        <div className="flex justify-end border-t border-(--m-mist) px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="rounded-full bg-(--m-ink) px-4 py-2 text-xs font-medium text-(--m-paper) hover:bg-(--m-emerald)"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
