"use client";

import { useActionState } from "react";
import { startCheckout } from "@/lib/actions/billing";
import PlanCard, { type PlanCardPlan } from "@/components/marketing/plan-card";
import { formatMoney } from "@/lib/money";
import { useAdminWeddingId } from "./wedding-context";
import { StatusBadge } from "@/components/super/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { SectionHeading } from "@/components/ui/section-heading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      <Card className={cn("block gap-0 rounded-md p-5 shadow-none", billing.currentPlan && !billing.currentPlan.free && "border-gold")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-(family-name:--m-display) text-2xl font-bold tracking-tight text-ink">
            {billing.currentPlan ? billing.currentPlan.name : "Free draft"}
          </h2>
          <Badge className="bg-emerald/12 px-2.5 py-1 text-[13px] font-semibold text-emerald">
            {billing.currentPlan?.comped ? "Complimentary" : "Current plan"}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
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
              <li key={h} className="rounded-full bg-accent px-2.5 py-1 text-[13px] text-ink">
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
                    // The popular plan sits on an ink card, so its gold button lightens on hover instead.
                    className={cn("w-full py-3", plan.popular && "hover:bg-paper hover:text-ink")}
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
          <SectionHeading title="Payments" />
          <div className="overflow-hidden rounded-md border bg-card">
            <Table className="min-w-0">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billing.payments.map((p) => (
                  <TableRow key={p.reference}>
                    <TableCell className="text-muted-foreground">{shortDate(p.date)}</TableCell>
                    <TableCell>{p.planName}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(p.amountKobo, NAIRA)}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status as PaymentStatus} />
                    </TableCell>
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
