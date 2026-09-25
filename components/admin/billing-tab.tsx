"use client";

import { useActionState } from "react";
import { startCheckout } from "@/lib/actions/billing";
import PlanCard, { type PlanCardPlan } from "@/components/marketing/plan-card";
import { formatMoney } from "@/lib/money";
import { useAdminWeddingId } from "./wedding-context";
import { StatusBadge } from "@/components/super/status-badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { SectionHeading } from "@/components/ui/section-heading";
import { TableShell, Td, Th } from "@/components/ui/table";
import { shortDate } from "@/lib/format-date";
import type { PaymentStatus } from "@/lib/generated/prisma/client";

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
  const currentHighlights = billing.plans.find((p) => p.current)?.highlights.slice(0, 3) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <Card as="section" className={billing.currentPlan && !billing.currentPlan.free ? "border-action" : ""}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-(family-name:--m-display) text-2xl font-bold tracking-tight text-ink">
            {billing.currentPlan ? billing.currentPlan.name : "Free draft"}
          </h2>
          <span className="rounded-full bg-success/12 px-2.5 py-1 text-[13px] font-semibold text-success">
            {billing.currentPlan?.comped ? "Complimentary" : "Current plan"}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">
          {!billing.currentPlan
            ? "Choose a plan to publish your site for guests."
            : billing.currentPlan.free
              ? "Upgrade any time; you only pay once per wedding."
              : "A one-time payment for this wedding."}{" "}
          {billing.currentPlan && closingNote(billing.currentPlan.closesAt)}
        </p>
        {currentHighlights.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Included in your plan">
            {currentHighlights.map((h) => (
              <li key={h} className="rounded-full bg-surface-muted px-2.5 py-1 text-[13px] text-ink">
                {h}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {!billing.paymentsEnabled && <Notice tone="info">Online payments aren&apos;t switched on yet.</Notice>}
      {state?.error && <Notice tone="error">{state.error}</Notice>}

      <div className="grid grid-cols-1 gap-5 pt-3 md:grid-cols-2 xl:grid-cols-3">
        {billing.plans.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            current={plan.current}
            action={
              plan.current ? (
                <p className={`text-sm font-semibold ${plan.popular ? "text-action" : "text-success"}`}>Your current plan</p>
              ) : plan.chargeKobo === null ? (
                <p className={`text-sm ${plan.popular ? "text-paper/70" : "text-ink/60"}`}>
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
                        ? "bg-action text-ink hover:bg-paper"
                        : "bg-ink text-paper hover:bg-success"
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
          <SectionHeading title="Payments" />
          <TableShell minWidth="min-w-0">
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Plan</Th>
                <Th numeric>Amount</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {billing.payments.map((p) => (
                <tr key={p.reference}>
                  <Td className="text-muted">{shortDate(p.date)}</Td>
                  <Td>{p.planName}</Td>
                  <Td numeric>{formatMoney(p.amountKobo, NAIRA)}</Td>
                  <Td>
                    <StatusBadge status={p.status as PaymentStatus} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </section>
      )}
    </div>
  );
}
