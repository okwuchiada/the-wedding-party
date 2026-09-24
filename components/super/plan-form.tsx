"use client";

import { useActionState } from "react";
import { savePlan } from "@/lib/actions/super";
import { FEATURE_LABELS, type PlanFeature } from "@/lib/plans";

export type PlanView = {
  id: string;
  key: string;
  name: string;
  priceKobo: number;
  maxGuests: number;
  sortOrder: number;
  active: boolean;
  features: Partial<Record<PlanFeature, boolean>>;
  weddingCount: number;
};

const field = "border border-(--m-mist) bg-white px-2 py-1.5 text-sm text-foreground outline-none focus:border-(--m-ink)/50";

export default function PlanForm({ plan }: { plan?: PlanView }) {
  const [state, formAction, pending] = useActionState(savePlan, undefined);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 rounded-[6px] bg-white p-4 sm:grid-cols-6">
      {plan && <input type="hidden" name="id" value={plan.id} />}
      <label className="flex flex-col gap-1 text-xs text-foreground/60">
        Key
        <input name="key" defaultValue={plan?.key} required className={field} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-foreground/60">
        Name
        <input name="name" defaultValue={plan?.name} required className={field} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-foreground/60">
        Price (₦)
        <input name="priceNaira" type="number" min={0} step="0.01" defaultValue={plan ? plan.priceKobo / 100 : ""} required className={field} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-foreground/60">
        Max guests
        <input name="maxGuests" type="number" min={1} defaultValue={plan?.maxGuests} required className={field} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-foreground/60">
        Order
        <input name="sortOrder" type="number" defaultValue={plan?.sortOrder ?? 0} className={field} />
      </label>
      <label className="flex items-center gap-2 self-end pb-2 text-xs text-foreground">
        <input type="checkbox" name="active" defaultChecked={plan?.active ?? true} />
        On sale
      </label>
      <div className="col-span-2 flex flex-wrap gap-4 sm:col-span-6">
        {(Object.keys(FEATURE_LABELS) as PlanFeature[]).map((f) => (
          <label key={f} className="flex items-center gap-2 text-xs text-foreground">
            <input type="checkbox" name={`feature_${f}`} defaultChecked={plan?.features[f] === true} />
            {FEATURE_LABELS[f]}
          </label>
        ))}
      </div>
      <div className="col-span-2 flex items-center gap-3 sm:col-span-6">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-(--m-gold) px-4 py-1.5 text-xs font-semibold text-(--m-ink) hover:bg-(--m-ink) hover:text-(--m-paper) disabled:opacity-60"
        >
          {pending ? "Saving…" : plan ? "Save" : "Create plan"}
        </button>
        {plan && plan.weddingCount > 0 && (
          <span className="text-[11px] text-foreground/55">
            Changes apply to the {plan.weddingCount} wedding{plan.weddingCount === 1 ? "" : "s"} on this plan.
          </span>
        )}
        {state?.error && <span className="text-xs text-burnt-orange">{state.error}</span>}
        {state?.success && <span className="text-xs text-olive">Saved</span>}
      </div>
    </form>
  );
}
