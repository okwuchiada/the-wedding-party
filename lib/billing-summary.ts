// What the Billing tab says about a wedding's plan: comparisons in words,
// what an upgrade adds, how long the site stays up, and its history. Pure.

import { hasFeature, UNLIMITED_GUESTS } from "@/lib/plans";

export type PlanTerms = {
  key: string;
  name: string;
  priceKobo: number;
  maxGuests: number;
  /** Null means no limit. */
  maxUploads: number | null;
  /** Null means the site stays up for good. */
  availabilityMonths: number | null;
  /** Empty means every theme. */
  themes: string[];
  features: unknown;
};

const count = (n: number) => n.toLocaleString("en-GB");
const yesNo = (on: boolean) => (on ? "Yes" : "No");

/** One row per thing a couple compares, worded the way they'd say it. */
const ROWS: { label: string; value: (plan: PlanTerms) => string }[] = [
  { label: "Guests who can RSVP", value: (p) => (p.maxGuests >= UNLIMITED_GUESTS ? "No limit" : count(p.maxGuests)) },
  {
    label: "Site stays online",
    value: (p) => (p.availabilityMonths === null ? "For good" : `${p.availabilityMonths} ${p.availabilityMonths === 1 ? "month" : "months"}`),
  },
  { label: "Themes", value: (p) => (p.themes.length === 0 ? "All" : count(p.themes.length)) },
  { label: "Custom colours and fonts", value: (p) => yesNo(hasFeature(p, "customTheme")) },
  { label: "Guest photo and video uploads", value: (p) => (p.maxUploads === null ? "No limit" : count(p.maxUploads)) },
  { label: "Guests can upload videos", value: (p) => yesNo(hasFeature(p, "video")) },
  {
    label: "Footer",
    value: (p) => (hasFeature(p, "customCredit") ? "Your own credit" : hasFeature(p, "removeBranding") ? "Removed" : "Vowly"),
  },
  { label: "Priority support", value: (p) => yesNo(hasFeature(p, "prioritySupport")) },
];

/** The comparison table: each row's value for every plan, in the plans' order. */
export function planComparison(plans: PlanTerms[]) {
  return ROWS.map((row) => ({ label: row.label, values: plans.map(row.value) }));
}

/** What moving from `current` to `next` changes; `was` is null without a current plan. */
export function planGains(current: PlanTerms | null, next: PlanTerms) {
  return ROWS.flatMap((row) => {
    const value = row.value(next);
    const was = current ? row.value(current) : null;
    return value === was ? [] : [{ label: row.label, value, was }];
  });
}

/** Whole calendar days from a to b (UTC), so "535 days left" matches a calendar. */
function daysBetween(a: Date, b: Date) {
  const day = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((day(b) - day(a)) / 86_400_000);
}

/** How much of the site's time online is used and left, counted from the wedding. Null when it stays up for good. */
export function onlineWindow(weddingDate: Date | null, closesAt: Date | null, today: Date) {
  if (!weddingDate || !closesAt) return null;
  const totalDays = daysBetween(weddingDate, closesAt);
  const daysUsed = Math.min(totalDays, Math.max(0, daysBetween(weddingDate, today)));
  return { totalDays, daysUsed, daysLeft: Math.max(0, daysBetween(today, closesAt)) };
}

export type TimelineEvent =
  | { kind: "created"; date: Date }
  | { kind: "paid"; date: Date; planName: string; amountKobo: number; reference: string }
  | { kind: "wedding"; date: Date }
  | { kind: "today"; date: Date }
  | { kind: "closes"; date: Date }
  | { kind: "forever"; date: null };

/** The site's life in date order: created, each payment, the wedding, today, and when it closes (or that it doesn't). */
export function billingTimeline(input: {
  createdAt: Date;
  payments: { date: Date; planName: string; amountKobo: number; reference: string }[];
  weddingDate: Date | null;
  closesAt: Date | null;
  today: Date;
}): TimelineEvent[] {
  const dated: Exclude<TimelineEvent, { kind: "forever" }>[] = [
    { kind: "created", date: input.createdAt },
    ...input.payments.map((p) => ({ kind: "paid" as const, ...p })),
    ...(input.weddingDate ? [{ kind: "wedding" as const, date: input.weddingDate }] : []),
    { kind: "today", date: input.today },
    ...(input.closesAt ? [{ kind: "closes" as const, date: input.closesAt }] : []),
  ];
  // Stable sort: events on the same day keep the order above.
  const sorted = dated.map((e, i) => ({ e, i })).sort((a, b) => a.e.date.getTime() - b.e.date.getTime() || a.i - b.i).map(({ e }) => e);
  return input.closesAt ? sorted : [...sorted, { kind: "forever", date: null }];
}
