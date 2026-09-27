"use client";

import { useActionState } from "react";
import { startCheckout } from "@/lib/actions/billing";
import PlanCard, { type PlanCardPlan } from "@/components/marketing/plan-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
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
        <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-ink">Your plan</h2>
        <p className="mt-1 text-sm text-ink/70">
          {!billing.currentPlan
            ? "You're on a free draft. Choose a plan to publish your site for guests."
            : billing.currentPlan.free
              ? `You're on ${billing.currentPlan.name}. Upgrade any time; you only pay once per wedding.`
              : `${billing.currentPlan.name}${billing.currentPlan.comped ? " (complimentary)" : ""}, a one-time payment for this wedding.`}
        </p>
        {billing.currentPlan && <p className="mt-1 text-sm text-ink/70">{closingNote(billing.currentPlan.closesAt)}</p>}
      </section>

      {!billing.paymentsEnabled && (
        <Alert className="border-transparent bg-accent text-ink/70">
          <AlertDescription className="text-xs text-ink/70">Online payments aren&apos;t switched on yet.</AlertDescription>
        </Alert>
      )}
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription className="text-xs">{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-5 pt-3 md:grid-cols-2 xl:grid-cols-3">
        {billing.plans.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            current={plan.current}
            action={
              plan.current ? (
                <p className={`text-sm font-semibold ${plan.popular ? "text-gold" : "text-emerald"}`}>Your current plan</p>
              ) : plan.chargeKobo === null ? (
                <p className={`text-sm ${plan.popular ? "text-paper/70" : "text-ink/60"}`}>
                  {plan.priceKobo === 0 ? "Included free" : "Included in your plan"}
                </p>
              ) : (
                <form action={formAction}>
                  <input type="hidden" name="planKey" value={plan.key} />
                  <Button
                    type="submit"
                    variant={plan.popular ? "default" : "ink"}
                    disabled={pending || !billing.paymentsEnabled}
                    className={cn("w-full px-4 py-3 disabled:opacity-50", plan.popular && "hover:bg-paper hover:text-ink")}
                  >
                    {pending
                      ? "Redirecting…"
                      : billing.currentPlan
                        ? `Upgrade, pay ${formatMoney(plan.chargeKobo, NAIRA)}`
                        : `Choose ${plan.name}`}
                  </Button>
                </form>
              )
            }
          />
        ))}
      </div>

      {billing.payments.length > 0 && (
        <section>
          <h2 className="mb-3 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-ink">Payments</h2>
          <div className="overflow-hidden rounded-md bg-white">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Date</TableHead>
                  <TableHead className="px-4">Plan</TableHead>
                  <TableHead className="px-4">Amount</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billing.payments.map((p) => (
                  <TableRow key={p.reference}>
                    <TableCell className="px-4 text-ink/70">{p.date}</TableCell>
                    <TableCell className="px-4">{p.planName}</TableCell>
                    <TableCell className="px-4">{formatMoney(p.amountKobo, NAIRA)}</TableCell>
                    <TableCell className="px-4 text-ink/70">{p.status.toLowerCase()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
