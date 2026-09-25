"use client";

import { useActionState } from "react";
import { startCheckout } from "@/lib/actions/billing";
import PlanCard, { type PlanCardPlan } from "@/components/marketing/plan-card";
import { formatMoney } from "@/lib/money";
import { useAdminWeddingId } from "./wedding-context";

export type BillingView = {
  currentPlan: {
    name: string;
    comped: boolean;
    free: boolean;
    /** When the guest site closes (ISO), or null if it stays up. */
    closesAt: string | null;
  } | null;
  paymentsEnabled: boolean;
  plans: (PlanCardPlan & {
    key: string;
    /** Amount due now, or null if this plan can't be bought (free, or not an upgrade). */
    chargeKobo: number | null;
    current: boolean;
  })[];
  payments: { reference: string; planName: string; amountKobo: number; status: string; date: string }[];
};

const NAIRA = { currency: "NGN", locale: "en-NG" };

function closingNote(closesAt: string | null) {
  if (!closesAt) return "Your site stays online for good.";
  const date = new Date(closesAt).toLocaleDateString("en-GB", { dateStyle: "long", timeZone: "UTC" });
  return new Date(closesAt) <= new Date()
    ? `Your site closed to guests on ${date}. Upgrade to bring it back.`
    : `Your site stays online until ${date}. Upgrade to keep it longer.`;
}

export default function BillingTab({ billing }: { billing: BillingView }) {
  const weddingId = useAdminWeddingId();
  const [state, formAction, pending] = useActionState(startCheckout.bind(null, weddingId), undefined);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">Your plan</h2>
        <p className="mt-1 text-sm text-foreground/70">
          {!billing.currentPlan
            ? "You're on a free draft. Choose a plan to publish your site for guests."
            : billing.currentPlan.free
              ? `You're on ${billing.currentPlan.name}. Upgrade any time; you only pay once per wedding.`
              : `${billing.currentPlan.name}${billing.currentPlan.comped ? " (complimentary)" : ""}, a one-time payment for this wedding.`}
        </p>
        {billing.currentPlan && <p className="mt-1 text-sm text-foreground/70">{closingNote(billing.currentPlan.closesAt)}</p>}
      </section>

      {!billing.paymentsEnabled && (
        <p className="bg-cream px-3 py-2 text-xs text-foreground/70">Online payments aren&apos;t switched on yet.</p>
      )}
      {state?.error && <p className="text-xs text-burnt-orange">{state.error}</p>}

      <div className="grid grid-cols-1 gap-5 pt-3 md:grid-cols-2 xl:grid-cols-3">
        {billing.plans.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            current={plan.current}
            action={
              plan.current ? (
                <p className={`text-sm font-semibold ${plan.popular ? "text-(--m-gold)" : "text-(--m-emerald)"}`}>Your current plan</p>
              ) : plan.chargeKobo === null ? (
                <p className={`text-sm ${plan.popular ? "text-(--m-paper)/70" : "text-(--m-ink)/60"}`}>
                  {plan.priceKobo === 0 ? "Included free" : "Included in your plan"}
                </p>
              ) : (
                <form action={formAction}>
                  <input type="hidden" name="planKey" value={plan.key} />
                  <button
                    type="submit"
                    disabled={pending || !billing.paymentsEnabled}
                    className={`w-full rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-50 ${
                      plan.popular
                        ? "bg-(--m-gold) text-(--m-ink) hover:bg-(--m-paper)"
                        : "bg-(--m-ink) text-(--m-paper) hover:bg-(--m-emerald)"
                    }`}
                  >
                    {pending
                      ? "Redirecting…"
                      : billing.currentPlan
                        ? `Upgrade, pay ${formatMoney(plan.chargeKobo, NAIRA)}`
                        : `Choose ${plan.name}`}
                  </button>
                </form>
              )
            }
          />
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
