"use client";

import { useCallback, useEffect } from "react";
import { toast as sonner } from "sonner";
import { Toaster } from "@/components/ui/sonner";

type Show = (t: { message: string; tone?: "success" | "error"; undo?: () => Promise<void> }) => void;

const DURATION_MS = 10_000;

/** Shows a toast (shadcn Sonner). Toasts pause while hovered, so Undo stays reachable. */
export function useToast(): Show {
  return useCallback<Show>(({ message, tone = "success", undo }) => {
    const show = tone === "error" ? sonner.error : sonner;
    show(message, {
      duration: DURATION_MS,
      closeButton: true,
      action: undo && {
        label: "Undo",
        onClick: () => {
          undo().catch(() => sonner.error("Couldn't undo that. Check your connection and try again.", { duration: DURATION_MS }));
        },
      },
    });
  }, []);
}

/** Shows a toast each time a form action returns success (or a message of its own). */
export function useSuccessToast(state: { success?: boolean; message?: string } | undefined, message: string) {
  const toast = useToast();
  useEffect(() => {
    if (state?.message) toast({ message: state.message });
    else if (state?.success) toast({ message });
  }, [state, message, toast]);
}

/** Wrap platform pages once; renders the toaster (visible toasts max three, newest at the bottom right). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" visibleToasts={3} />
    </>
  );
}
