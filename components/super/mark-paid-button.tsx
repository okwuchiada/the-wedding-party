"use client";

import { useActionState, useState } from "react";
import { markPaymentPaid } from "@/lib/actions/super";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";

/**
 * "Mark as paid" for a pending or failed payment whose money staff know arrived
 * (e.g. from Paystack's success email). Asks for the date and a note, which go
 * into the payment record and the audit log.
 */
export default function MarkPaidButton({ reference, amountLabel }: { reference: string; amountLabel: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(markPaymentPaid.bind(null, reference), undefined);
  const today = new Date().toISOString().slice(0, 10);

  if (state?.message) return <span className="text-[13px] text-success">{state.message}</span>;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass("secondary", "sm")}
      >
        Mark as paid
      </button>
    );
  }

  return (
    <form action={formAction} className="flex w-64 flex-col gap-2 rounded-[6px] border border-line bg-paper p-3 text-left">
      <p className="text-xs text-muted">
        Only if the money arrived: this gives the wedding its plan as if Paystack confirmed {amountLabel} for{" "}
        <span className="font-mono">{reference}</span>.
      </p>
      <label className="flex flex-col gap-1 text-[13px] text-muted">
        Paid on
        <input type="date" name="paidOn" defaultValue={today} max={today} className={`${inputClass} py-1.5 text-[13px]`} />
      </label>
      <label className="flex flex-col gap-1 text-[13px] text-muted">
        How you know
        <textarea
          name="note"
          required
          minLength={10}
          maxLength={500}
          rows={3}
          placeholder="e.g. Paystack success email, 27 Sept, same reference and amount"
          className={`${inputClass} py-1.5 text-[13px]`}
        />
      </label>
      {state?.error && <p className="text-[13px] text-danger">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass("inverse", "sm")}
        >
          {pending ? "Saving…" : "Mark as paid"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={buttonClass("text", "sm")}>
          Cancel
        </button>
      </div>
    </form>
  );
}
