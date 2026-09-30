"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Toast = { id: number; message: string; tone: "success" | "error"; undo?: () => Promise<void> };
type Show = (t: { message: string; tone?: Toast["tone"]; undo?: () => Promise<void> }) => void;

const ToastContext = createContext<Show>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

/** Shows a toast each time a form action returns success (or a message of its own). */
export function useSuccessToast(state: { success?: boolean; message?: string } | undefined, message: string) {
  const toast = useToast();
  useEffect(() => {
    if (state?.message) toast({ message: state.message });
    else if (state?.success) toast({ message });
  }, [state, message, toast]);
}

const DURATION_MS = 10_000;

/** One toast. Its timer pauses while it's hovered or has keyboard focus, so Undo stays reachable. */
function ToastItem({ toast, dismiss, onUndoFailed }: { toast: Toast; dismiss: (id: number) => void; onUndoFailed: () => void }) {
  const [paused, setPaused] = useState(false);
  const onDismiss = useCallback(() => dismiss(toast.id), [dismiss, toast.id]);
  const [undoing, setUndoing] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(onDismiss, DURATION_MS);
    return () => clearTimeout(timer);
  }, [paused, onDismiss]);

  const undo = async () => {
    setUndoing(true);
    try {
      await toast.undo!();
      onDismiss();
    } catch {
      onDismiss();
      onUndoFailed();
    }
  };

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto flex w-full items-center gap-3 rounded-[8px] px-4 py-3 text-sm font-medium shadow-[0_16px_32px_-16px_rgb(22_32_74/0.6)] ${toast.tone === "error" ? "bg-danger text-white" : "bg-ink text-paper"}`}
    >
      <span className="min-w-0 flex-1">{toast.message}</span>
      {toast.undo && (
        <button type="button" disabled={undoing} onClick={undo} className="min-h-9 px-1 font-semibold text-action underline underline-offset-4 disabled:opacity-60">
          {undoing ? "Undoing…" : "Undo"}
        </button>
      )}
      <button type="button" aria-label="Dismiss" onClick={onDismiss} className="-mr-1 min-h-9 px-1 opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const show = useCallback<Show>(({ message, tone = "success", undo }) => {
    const id = nextId.current++;
    setToasts((all) => [...all.slice(-2), { id, message, tone, undo }]);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-toast flex flex-col items-end gap-2 sm:left-auto sm:w-96">
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            toast={t}
            dismiss={dismiss}
            onUndoFailed={() => show({ message: "Couldn't undo that. Check your connection and try again.", tone: "error" })}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
