"use client";

import { useActionState, useState } from "react";
import { markPaymentPaid } from "@/lib/actions/super";
import { Button } from "@/components/ui/button";
import { TEXT_ACTION } from "@/components/admin/form-styles";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * "Mark as paid" for a pending or failed payment whose money staff know arrived
 * (e.g. from Paystack's success email). Asks for the date and a note, which go
 * into the payment record and the audit log.
 */
export default function MarkPaidButton({ reference, amountLabel }: { reference: string; amountLabel: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(markPaymentPaid.bind(null, reference), undefined);
  const today = new Date().toISOString().slice(0, 10);

  if (state?.message) return <span className="text-[13px] text-emerald">{state.message}</span>;

  if (!open) {
    return (
      <Button
        type="button"
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
      >
        Mark as paid
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex w-64 flex-col gap-2 rounded-[6px] border border-border bg-paper p-3 text-left">
      <p className="text-xs text-muted-foreground">
        Only if the money arrived: this gives the wedding its plan as if Paystack confirmed {amountLabel} for{" "}
        <span className="font-mono">{reference}</span>.
      </p>
      <Label className="flex-col items-stretch gap-1 text-[13px] text-muted-foreground">
        Paid on
        <Input type="date" name="paidOn" defaultValue={today} max={today} className="py-1.5 text-[13px]" />
      </Label>
      <Label className="flex-col items-stretch gap-1 text-[13px] text-muted-foreground">
        How you know
        <Textarea
          name="note"
          required
          minLength={10}
          maxLength={500}
          rows={3}
          placeholder="e.g. Paystack success email, 27 Sept, same reference and amount"
          className="py-1.5 text-[13px]"
        />
      </Label>
      {state?.error && <p className="text-[13px] text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={pending}
          variant="ink"
          size="sm"
        >
          {pending ? "Saving…" : "Mark as paid"}
        </Button>
        <Button type="button" onClick={() => setOpen(false)} variant="link" size="xs" className={TEXT_ACTION}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
