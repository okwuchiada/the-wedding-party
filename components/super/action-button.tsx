"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/components/ui/button";
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
        className={buttonClass(tone === "danger" ? "danger" : "secondary", "sm")}
      >
        {pending ? "…" : label}
      </button>
      {result?.error && <span className="text-[13px] text-danger">{result.error}</span>}
      {result?.message && <span className="text-[13px] text-success">{result.message}</span>}
      {confirmDialog}
    </span>
  );
}
