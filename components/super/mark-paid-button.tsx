"use client";

import { useActionState, useState } from "react";
import { markPaymentPaid } from "@/lib/actions/super";

/**
 * "Mark as paid" for a pending or failed payment whose money staff know arrived
 * (e.g. from Paystack's success email). Asks for the date and a note, which go
 * into the payment record and the audit log.
 */
export default function MarkPaidButton({ reference, amountLabel }: { reference: string; amountLabel: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(markPaymentPaid.bind(null, reference), undefined);
  const today = new Date().toISOString().slice(0, 10);

  if (state?.message) return <span className="text-[11px] text-olive">{state.message}</span>;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-(--m-ink)/25 px-3 py-1 text-xs font-medium hover:border-(--m-ink)"
      >
        Mark as paid
      </button>
    );
  }

  return (
    <form action={formAction} className="flex w-64 flex-col gap-2 rounded-[6px] border border-(--m-mist) bg-(--m-paper) p-3 text-left">
      <p className="text-xs text-foreground/75">
        Only if the money arrived: this gives the wedding its plan as if Paystack confirmed {amountLabel} for{" "}
        <span className="font-mono">{reference}</span>.
      </p>
      <label className="flex flex-col gap-1 text-[11px] text-foreground/60">
        Paid on
        <input type="date" name="paidOn" defaultValue={today} max={today} className="border border-(--m-mist) bg-white px-2 py-1 text-xs" />
      </label>
      <label className="flex flex-col gap-1 text-[11px] text-foreground/60">
        How you know
        <textarea
          name="note"
          required
          minLength={10}
          maxLength={500}
          rows={3}
          placeholder="e.g. Paystack success email, 27 Sept, same reference and amount"
          className="border border-(--m-mist) bg-white px-2 py-1 text-xs"
        />
      </label>
      {state?.error && <p className="text-[11px] text-burnt-orange">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-(--m-ink) px-3 py-1 text-xs font-semibold text-(--m-paper) hover:bg-(--m-emerald) disabled:opacity-60"
        >
          {pending ? "Saving…" : "Mark as paid"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-3 py-1 text-xs hover:bg-(--m-mist)">
          Cancel
        </button>
      </div>
    </form>
  );
}
