"use client";

import { useState, useTransition } from "react";
import { useConfirm } from "@/components/admin/use-confirm";
import { Button } from "@/components/ui/button";
import type { SuperActionResult } from "@/lib/actions/super";
import { cn } from "@/lib/utils";
import { ResultText } from "@/components/result-text";

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
      <Button
        type="button"
        variant="outline"
        size="xs"
        disabled={pending}
        onClick={async () => {
          if (confirmText && !(await confirm({ title: confirmText, danger: tone === "danger" }))) return;
          startTransition(async () => setResult((await action()) ?? null));
        }}
        className={cn("py-1", tone === "danger" && "border-coral/40 text-coral-deep hover:border-coral-deep hover:bg-coral-deep hover:text-white")}
      >
        {pending ? "…" : label}
      </Button>
      <ResultText error={result?.error} message={result?.message} className="text-[11px]" />
      {confirmDialog}
    </span>
  );
}
