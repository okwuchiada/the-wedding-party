"use client";

import { useState, useTransition } from "react";
import { useConfirm } from "@/components/admin/use-confirm";
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
  const { confirm, confirmDialog } = useConfirm();

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (confirmText && !(await confirm({ title: confirmText, danger: tone === "danger" }))) return;
          startTransition(async () => setResult((await action()) ?? null));
        }}
        className={`rounded-full border px-3 py-1 text-xs font-medium disabled:opacity-50 ${
          tone === "danger"
            ? "border-burnt-orange/40 text-burnt-orange hover:bg-burnt-orange hover:text-ivory"
            : "border-(--m-ink)/25 text-foreground hover:border-(--m-ink)"
        }`}
      >
        {pending ? "…" : label}
      </button>
      {result?.error && <span className="text-[11px] text-burnt-orange">{result.error}</span>}
      {result?.message && <span className="text-[11px] text-olive">{result.message}</span>}
      {confirmDialog}
    </span>
  );
}
