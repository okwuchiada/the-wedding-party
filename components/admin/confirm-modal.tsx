"use client";

import { useEffect } from "react";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmOptions & {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-100 flex items-center justify-center bg-foreground/40 px-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white p-6 shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)]"
      >
        <h2 id="confirm-modal-title" className="font-(family-name:--serif) text-xl text-foreground">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm text-foreground/70">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border border-olive/30 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-burnt-orange hover:text-burnt-orange"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className={`px-4 py-2 text-xs font-medium text-ivory transition-colors ${
              danger ? "bg-burnt-orange hover:bg-burnt-orange-dark" : "bg-olive hover:bg-olive-dark"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
