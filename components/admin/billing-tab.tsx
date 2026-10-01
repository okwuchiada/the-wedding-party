"use client";

import { Check, ChevronDown, Copy } from "lucide-react";
import { useActionState, useState } from "react";
import { startCheckout } from "@/lib/actions/billing";
import type { BillingView } from "@/lib/billing-view";
import { formatMoney } from "@/lib/money";
import type { PaymentStatus } from "@/lib/generated/prisma/client";
import { StatusBadge } from "@/components/super/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Notice } from "@/components/ui/notice";
import { Progress } from "@/components/ui/progress";
import { SectionHeading } from "@/components/ui/section-heading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useAdminWeddingId } from "./wedding-context";

export type { BillingView };

const NAIRA = { currency: "NGN", locale: "en-NG" };
const naira = (kobo: number) => formatMoney(kobo, NAIRA);
const count = (n: number) => n.toLocaleString("en-GB");
const days = (n: number) => `${count(n)} ${n === 1 ? "day" : "days"}`;

/** A payment reference with a button that copies it, for talking to the bank or support. */
function Reference({ value }: { value: string }) {
  const toast = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ message: "Reference copied" });
    } catch {
      toast({ message: "Couldn't copy. Select the reference and copy it yourself.", tone: "error" });
    }
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-[13px] select-all">{value}</span>
      <Button type="button" variant="ghost" size="icon-xs" onClick={copy} aria-label={`Copy reference ${value}`} className="text-muted-foreground hover:text-ink">
        <Copy />
      </Button>
    </span>
  );
}

function Meter({ label, value, max, detail, warn = false }: { label: string; value: number; max: number; detail: string; warn?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 text-[13px]">
      <div className="flex justify-between gap-3 text-muted-foreground">
        <span>{label}</span>
        <span className="font-semibold text-ink tabular-nums">{detail}</span>
      </div>
      <Progress value={max > 0 ? Math.min(100, (value / max) * 100) : 0} aria-label={`${label}: ${detail}`} indicatorClassName={warn ? "bg-gold" : undefined} />
    </div>
  );
}

/** Label / value rows. */
function Facts({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2.5 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="text-muted-foreground">{r.label}</dt>
          <dd className="font-medium text-ink tabular-nums">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function CurrentPlan({ billing }: { billing: BillingView }) {
  const c = billing.current;
  if (!c) {
    return (
      <Card className="block gap-0 rounded-md p-5 shadow-none">
        <h2 className="font-(family-name:--m-display) text-xl font-bold tracking-tight text-ink">No plan yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose a plan to publish your site for guests.</p>
      </Card>
    );
  }
  const status = c.comped ? "Complimentary" : c.free ? "Free plan" : "Paid";
  // "Everything in Free" says little on its own; the comparison table covers it.
  const included = c.highlights.filter((h) => !/^everything in /i.test(h)).slice(0, 6);
  const small = "font-normal text-muted-foreground";
  return (
    <Card className="flex flex-col gap-4 rounded-md p-5 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-(family-name:--m-display) text-xl font-bold tracking-tight text-ink">{c.name}</h2>
        <Badge className={cn("px-2.5 py-1 text-[13px] font-semibold", c.comped || c.free ? "bg-accent text-ink" : "bg-emerald/12 text-emerald")}>{status}</Badge>
      </div>
      <Facts
        rows={[
          {
            label: "Paid",
            value: c.paid ? (
              <>
                {naira(c.paid.amountKobo)} <span className={small}>on {c.paid.on}</span>
              </>
            ) : c.comped ? (
              <span className={small}>Nothing; this plan was given to you</span>
            ) : (
              <span className={small}>Nothing; it&apos;s free</span>
            ),
          },
          {
            label: c.closed ? "Closed to guests" : "Online until",
            value: c.closesOn ? (
              <>
                {c.closesOn}
                {c.window && !c.closed && <span className={small}> · {days(c.window.daysLeft)} left</span>}
              </>
            ) : c.forever ? (
              "For good"
            ) : (
              <span className={small}>Set your wedding date to see this</span>
            ),
          },
          {
            label: "Guests",
            value: (
              <>
                {count(c.guests.attending)} attending <span className={small}>· {c.guests.limit === null ? "no limit" : `limit ${count(c.guests.limit)}`}</span>
              </>
            ),
          },
        ]}
      />
      <div className="flex flex-col gap-3">
        {c.uploads.limit !== null && (
          <Meter label="Guest photo and video uploads" value={c.uploads.used} max={c.uploads.limit} detail={`${count(c.uploads.used)} of ${count(c.uploads.limit)}`} warn={c.uploads.used >= c.uploads.limit} />
        )}
        {c.guests.limit !== null && (
          <Meter label="Guests attending" value={c.guests.attending} max={c.guests.limit} detail={`${count(c.guests.attending)} of ${count(c.guests.limit)}`} warn={c.guests.attending >= c.guests.limit} />
        )}
        {/* The plan's time counts from the wedding day, so there's nothing to show before it. */}
        {c.window && c.window.daysUsed > 0 && (
          <Meter label="Time online used" value={c.window.daysUsed} max={c.window.totalDays} detail={`${count(c.window.daysUsed)} of ${days(c.window.totalDays)}`} warn={c.closed} />
        )}
      </div>
      {included.length > 0 && (
        <div className="flex flex-col gap-2.5 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-ink">Included in {c.name}</h3>
          <ul className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm text-ink sm:grid-cols-2">
            {included.map((h) => (
              <li key={h} className="flex gap-2">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function NextStep({ billing }: { billing: BillingView }) {
  const weddingId = useAdminWeddingId();
  const [state, formAction, pending] = useActionState(startCheckout.bind(null, weddingId), undefined);
  const next = billing.next;

  if (!next) {
    // Top plan already: nothing to sell; the left card lists what's included.
    return (
      <Card className="flex flex-col gap-2 rounded-md p-5 shadow-none">
        <h2 className="font-(family-name:--m-display) text-xl font-bold tracking-tight text-ink">You have everything</h2>
        <p className="text-sm text-muted-foreground">{billing.current?.name ?? "Your plan"} is our top plan, so there&apos;s nothing more to buy.</p>
      </Card>
    );
  }

  const credit = next.priceKobo - next.chargeKobo;
  return (
    <Card className="flex flex-col gap-4 rounded-md border-gold p-5 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-(family-name:--m-display) text-xl font-bold tracking-tight text-ink">Next step: {next.name}</h2>
        <Badge variant="gold" className="px-2.5 py-1 text-[13px]">
          Recommended
        </Badge>
      </div>
      {next.gains.length > 0 && (
        <ul className="flex flex-col gap-2 text-sm" aria-label={`What ${next.name} adds`}>
          {next.gains.map((g) => (
            <li key={g.label} className="grid grid-cols-[1rem_1fr] gap-2">
              <span aria-hidden className="font-bold text-emerald">
                +
              </span>
              <span>
                <span className="text-ink">
                  {g.label}: <b className="font-semibold">{g.value}</b>
                </span>
                {g.was && <span className="text-muted-foreground"> (now {g.was})</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-sm tabular-nums">
        <dt className="text-muted-foreground">{next.name}</dt>
        <dd className="text-right">{naira(next.priceKobo)}</dd>
        {credit > 0 && (
          <>
            <dt className="text-muted-foreground">Already paid</dt>
            <dd className="text-right">− {naira(credit)}</dd>
          </>
        )}
        <dt className="border-t border-border pt-2 font-semibold text-ink">Due now</dt>
        <dd className="border-t border-border pt-2 text-right text-base font-bold text-ink">{naira(next.chargeKobo)}</dd>
      </dl>
      {!billing.paymentsEnabled && <Notice tone="info">Online payments aren&apos;t switched on yet.</Notice>}
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      <form action={formAction}>
        <input type="hidden" name="planKey" value={next.key} />
        <Button type="submit" className="w-full" disabled={pending || !billing.paymentsEnabled}>
          {pending ? "Opening checkout…" : `Upgrade to ${next.name}, pay ${naira(next.chargeKobo)}`}
        </Button>
      </form>
      <p className="text-[13px] text-muted-foreground">One payment for this wedding. No renewals.</p>
    </Card>
  );
}

const EVENT_TEXT: Record<BillingView["timeline"][number]["kind"], string> = {
  created: "Site created",
  paid: "",
  wedding: "Wedding day",
  today: "Today",
  closes: "Closes to guests",
  forever: "Stays online for good",
};

function Timeline({ billing }: { billing: BillingView }) {
  const events = billing.timeline;
  const todayAt = events.findIndex((e) => e.kind === "today");
  const daysLeft = billing.current?.window?.daysLeft;
  return (
    <Card className="flex flex-col gap-4 rounded-md p-5 shadow-none">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-(family-name:--m-display) text-xl font-bold tracking-tight text-ink">Your site&apos;s timeline</h2>
        {daysLeft !== undefined && !billing.current?.closed && <span className="text-sm text-muted-foreground tabular-nums">{days(daysLeft)} until it closes</span>}
      </div>
      {/* Across on wide screens, down on phones. Done events are emerald, today gold. */}
      <div className="relative">
        <span aria-hidden className="absolute top-3 bottom-3 left-[11px] w-0.5 bg-mist sm:top-[11px] sm:right-[11px] sm:bottom-auto sm:h-0.5 sm:w-auto" />
        <ol className="relative grid grid-cols-1 gap-4 sm:auto-cols-fr sm:grid-flow-col sm:gap-0">
          {events.map((e, i) => {
            const done = i < todayAt;
            const now = e.kind === "today";
            return (
              <li key={`${e.kind}-${i}`} className={cn("grid grid-cols-[22px_1fr] gap-x-3 sm:flex sm:flex-col sm:gap-1 sm:pr-3", i === events.length - 1 && "sm:items-end sm:pr-0 sm:text-right")}>
                <span aria-hidden className={cn("relative size-[22px] rounded-full border-2 bg-card", done ? "border-emerald bg-emerald" : now ? "border-gold ring-4 ring-gold/25" : "border-mist")} />
                <div className="flex flex-col gap-0.5 sm:mt-1.5">
                  <span className="text-[13px] text-muted-foreground tabular-nums">{e.on ?? "No end date"}</span>
                  <span className="text-sm font-semibold text-ink">{e.kind === "paid" ? `${e.planName} · ${naira(e.amountKobo)}` : EVENT_TEXT[e.kind]}</span>
                  {e.kind === "paid" && <span className="font-mono text-xs text-muted-foreground">{e.reference}</span>}
                  {e.kind === "closes" && billing.next && !billing.current?.closed && <span className="text-[13px] text-muted-foreground">Upgrade to keep it up longer</span>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}

function Compare({ billing }: { billing: BillingView }) {
  const [open, setOpen] = useState(false);
  const { plans, rows } = billing.comparison;
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border bg-card">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="h-auto w-full justify-between rounded-md px-5 py-3.5 text-sm font-semibold hover:bg-accent">
          Compare all plans
          <ChevronDown aria-hidden className={cn("transition-transform motion-reduce:transition-none", open && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t">
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>What you get</TableHead>
              {plans.map((p) => (
                <TableHead key={p.key} className={cn("align-bottom", p.current && "bg-gold/10")}>
                  <span className="block font-(family-name:--m-display) text-base font-bold text-ink">{p.name}</span>
                  {p.current ? "Your plan" : naira(p.priceKobo)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.label} className="hover:bg-transparent">
                <TableCell className="text-ink">{r.label}</TableCell>
                {r.values.map((v, i) => (
                  <TableCell key={plans[i].key} className={cn("tabular-nums", plans[i].current && "bg-gold/10", v === "No" ? "text-muted-foreground" : "text-ink")}>
                    {v}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function BillingTab({ billing }: { billing: BillingView }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.05fr_1fr]">
        <CurrentPlan billing={billing} />
        <NextStep billing={billing} />
      </div>

      <Timeline billing={billing} />

      <Compare billing={billing} />

      <section className="mt-3">
        <SectionHeading title="Payments" />
        {billing.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {billing.current?.comped ? "No payments: your plan was given to you." : "No payments yet."}
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border bg-card">
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billing.payments.map((p) => (
                  <TableRow key={p.reference}>
                    <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">{p.when}</TableCell>
                    <TableCell>{p.planName}</TableCell>
                    <TableCell>
                      <Reference value={p.reference} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{naira(p.amountKobo)}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status as PaymentStatus} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
