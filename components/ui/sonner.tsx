"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** shadcn's Sonner toaster in Vowly colours: ink toasts, coral-deep errors, gold action links. The platform has no dark mode. */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "!bg-ink !text-paper !border-0 !rounded-lg !shadow-[0_16px_32px_-16px_rgb(22_32_74/0.6)] !font-medium",
          error: "!bg-destructive !text-white",
          actionButton: "!bg-transparent !text-gold !font-semibold !underline !underline-offset-4",
          closeButton: "!bg-ink !text-paper !border-paper/20",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
