// Shapes a wedding's plan, payments and usage into what the Billing tab shows.
// Pure: the dashboard page passes in what it already loaded.

import { upgradeCharge } from "@/lib/billing";
import { billingTimeline, onlineWindow, planComparison, planGains, type PlanTerms } from "@/lib/billing-summary";
import { siteClosesAt, UNLIMITED_GUESTS } from "@/lib/plans";

type Plan = PlanTerms & { id: string; active: boolean; tagline: string | null; highlights: string[] };
type Payment = { reference: string; amountKobo: number; status: string; createdAt: Date; paidAt: Date | null; plan: { id: string; name: string } };

export type BillingView = ReturnType<typeof billingView>;

/** "2 Aug 2026" for calendar days (wedding dates are stored as wall-clock time in UTC fields). */
const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function billingView(input: {
  wedding: { createdAt: Date; comped: boolean; timezone: string; plan: Plan | null };
  weddingDate: Date | null;
  plans: Plan[];
  payments: Payment[];
  attendingGuests: number;
  uploadsUsed: number;
  paymentsEnabled: boolean;
  today?: Date;
}) {
  const { wedding, plans } = input;
  const today = input.today ?? new Date();
  const current = wedding.plan;
  const tz = wedding.timezone;
  /** "2 Aug 2026, 14:32" for real moments, in the wedding's own timezone. */
  const moment = (d: Date) =>
    d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz });
  const dayIn = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: tz });

  const succeeded = input.payments.filter((p) => p.status === "SUCCESS");
  const paidKobo = succeeded.reduce((sum, p) => sum + p.amountKobo, 0);
  const closesAt = siteClosesAt(current, input.weddingDate);
  const window = onlineWindow(input.weddingDate, closesAt, today);
  const lastForPlan = current ? succeeded.filter((p) => p.plan.id === current.id).sort((a, b) => +(b.paidAt ?? b.createdAt) - +(a.paidAt ?? a.createdAt))[0] : undefined;

  // The cheapest plan they can buy now, if any.
  const buyable = plans
    .filter((p) => p.priceKobo > 0)
    .map((p) => ({ plan: p, chargeKobo: upgradeCharge(p, current, paidKobo) }))
    .filter((p): p is { plan: Plan; chargeKobo: number } => p.chargeKobo !== null);
  const next = buyable[0];

  // The table shows every plan on sale, plus the current one if it's been retired.
  const shown = current && !plans.some((p) => p.id === current.id) ? [...plans, current] : plans;

  return {
    current: current
      ? {
          name: current.name,
          comped: wedding.comped,
          free: current.priceKobo === 0,
          paid: lastForPlan ? { amountKobo: lastForPlan.amountKobo, on: dayIn(lastForPlan.paidAt ?? lastForPlan.createdAt) } : null,
          closesOn: closesAt ? day(closesAt) : null,
          forever: current.availabilityMonths === null,
          closed: closesAt !== null && today >= closesAt,
          window,
          guests: { attending: input.attendingGuests, limit: current.maxGuests >= UNLIMITED_GUESTS ? null : current.maxGuests },
          uploads: { used: input.uploadsUsed, limit: current.maxUploads },
          highlights: current.highlights,
        }
      : null,
    paidKobo,
    paymentsEnabled: input.paymentsEnabled,
    next: next
      ? {
          key: next.plan.key,
          name: next.plan.name,
          tagline: next.plan.tagline,
          priceKobo: next.plan.priceKobo,
          chargeKobo: next.chargeKobo,
          gains: planGains(current, next.plan),
        }
      : null,
    comparison: {
      plans: shown.map((p) => ({ key: p.key, name: p.name, priceKobo: p.priceKobo, current: p.id === current?.id })),
      rows: planComparison(shown),
    },
    timeline: billingTimeline({
      createdAt: wedding.createdAt,
      payments: succeeded
        .map((p) => ({ date: p.paidAt ?? p.createdAt, planName: p.plan.name, amountKobo: p.amountKobo, reference: p.reference }))
        .sort((a, b) => +a.date - +b.date),
      weddingDate: input.weddingDate,
      closesAt,
      today,
    }).map((e) => {
      if (e.kind === "forever") return { ...e, on: null };
      // Created, paid and today are real moments; the wedding and closing day are calendar days.
      return { ...e, date: null, on: e.kind === "wedding" || e.kind === "closes" ? day(e.date) : dayIn(e.date) };
    }),
    // Failed attempts stay visible so couples can match them with their bank; abandoned ones (still pending) don't.
    payments: input.payments
      .filter((p) => p.status !== "PENDING")
      .map((p) => ({ reference: p.reference, planName: p.plan.name, amountKobo: p.amountKobo, status: p.status, when: moment(p.paidAt ?? p.createdAt) })),
  };
}
