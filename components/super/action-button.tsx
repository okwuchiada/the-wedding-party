"use client";

import { useState, useTransition } from "react";
import type { SuperActionResult } from "@/lib/actions/super";

/** Runs a bound super-admin action, optionally after a confirm prompt, and shows its result. */
export default function ActionButton({
  action,
  label,
  confirmText,
  tone = "default",
}: {
  action: () => Promise<SuperActionResult | void>;
  label: string;
  confirmText?: string;
  tone?: "default" | "danger";
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SuperActionResult | null>(null);

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          startTransition(async () => setResult((await action()) ?? null));
        }}
        className={`border px-2.5 py-1 text-[11px] font-medium disabled:opacity-50 ${
          tone === "danger"
            ? "border-burnt-orange/40 text-burnt-orange hover:bg-burnt-orange hover:text-ivory"
            : "border-olive/30 text-foreground hover:border-burnt-orange hover:text-burnt-orange"
        }`}
      >
        {pending ? "…" : label}
      </button>
      {result?.error && <span className="text-[11px] text-burnt-orange">{result.error}</span>}
      {result?.message && <span className="text-[11px] text-olive">{result.message}</span>}
    </span>
  );
}
