"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export type ConfirmOptions = { title: string; description?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean };

export default function ConfirmModal({
  open, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = true, onConfirm, onCancel,
}: ConfirmOptions & { open: boolean; onConfirm: () => void; onCancel: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>("button, [href], input, select, textarea");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" className="fixed inset-0 z-overlay flex items-center justify-center bg-ink/40 px-4" onClick={onCancel}>
      <div ref={panelRef} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-[8px] border border-line bg-surface p-6">
        <h2 id="confirm-modal-title" className="font-(family-name:--m-display) text-xl font-bold tracking-tight text-ink">{title}</h2>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={danger ? "danger" : "inverse"} size="sm" onClick={onConfirm} autoFocus>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
