"use client";

import { useActionState } from "react";
import { startCheckout } from "@/lib/actions/billing";
import { formatMoney } from "@/lib/money";
import { FEATURE_LABELS, type PlanFeature } from "@/lib/plans";
import { useAdminWeddingId } from "./wedding-context";

export type BillingView = {
  currentPlan: { name: string; comped: boolean } | null;
  paymentsEnabled: boolean;
  plans: {
    key: string;
    name: string;
    priceKobo: number;
    maxGuests: number;
    features: PlanFeature[];
    /** Amount due now, or null if this plan can't be chosen. */
    chargeKobo: number | null;
    current: boolean;
  }[];
  payments: { reference: string; planName: string; amountKobo: number; status: string; date: string }[];
};

const NAIRA = { currency: "NGN", locale: "en-NG" };

export default function BillingTab({ billing }: { billing: BillingView }) {
  const weddingId = useAdminWeddingId();
  const [state, formAction, pending] = useActionState(startCheckout.bind(null, weddingId), undefined);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">Your plan</h2>
        <p className="mt-1 text-sm text-foreground/70">
          {billing.currentPlan
            ? `${billing.currentPlan.name}${billing.currentPlan.comped ? " (complimentary)" : ""} — a one-time payment for this wedding.`
            : "You're on a free draft. Choose a plan to publish your site for guests."}
        </p>
      </section>

      {!billing.paymentsEnabled && (
        <p className="bg-cream px-3 py-2 text-xs text-foreground/70">Online payments aren&apos;t switched on yet.</p>
      )}
      {state?.error && <p className="text-xs text-burnt-orange">{state.error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {billing.plans.map((plan) => (
          <form
            key={plan.key}
            action={formAction}
            className={`flex flex-col gap-3 rounded-[6px] bg-white p-5 ${plan.current ? "ring-2 ring-burnt-orange" : "ring-1 ring-olive/15"}`}
          >
            <input type="hidden" name="planKey" value={plan.key} />
            <h3 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">{plan.name}</h3>
            <p className="text-xl text-foreground">{formatMoney(plan.priceKobo, NAIRA)}</p>
            <ul className="flex flex-col gap-1 text-sm text-foreground/75">
              <li>Up to {plan.maxGuests.toLocaleString()} guests</li>
              <li>RSVPs, registry &amp; wishes</li>
              {plan.features.map((feature) => (
                <li key={feature}>{FEATURE_LABELS[feature]}</li>
              ))}
            </ul>
            <div className="mt-auto pt-2">
              {plan.current ? (
                <p className="text-xs font-medium text-olive">Current plan</p>
              ) : plan.chargeKobo === null ? (
                <p className="text-xs text-foreground/50">Included in your plan</p>
              ) : (
                <button
                  type="submit"
                  disabled={pending || !billing.paymentsEnabled}
                  className="w-full rounded-full bg-(--m-gold) px-4 py-2.5 text-sm font-semibold text-(--m-ink) hover:bg-(--m-ink) hover:text-(--m-paper) disabled:opacity-50"
                >
                  {pending
                    ? "Redirecting…"
                    : billing.currentPlan
                      ? `Upgrade — pay ${formatMoney(plan.chargeKobo, NAIRA)}`
                      : `Choose ${plan.name}`}
                </button>
              )}
            </div>
          </form>
        ))}
      </div>

      {billing.payments.length > 0 && (
        <section>
          <h2 className="mb-3 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">Payments</h2>
          <table className="w-full rounded-[6px] bg-white text-left text-sm">
            <thead className="text-xs text-foreground/55">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {billing.payments.map((p) => (
                <tr key={p.reference} className="border-t border-(--m-mist)">
                  <td className="px-4 py-3 text-foreground/70">{p.date}</td>
                  <td className="px-4 py-3">{p.planName}</td>
                  <td className="px-4 py-3">{formatMoney(p.amountKobo, NAIRA)}</td>
                  <td className="px-4 py-3 text-foreground/70">{p.status.toLowerCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
