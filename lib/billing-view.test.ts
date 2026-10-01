import { describe, expect, it } from "vitest";
import { billingView } from "@/lib/billing-view";
import { UNLIMITED_GUESTS } from "@/lib/plans";

const plan = (over: Partial<Parameters<typeof billingView>[0]["plans"][number]>) => ({
  id: "x",
  key: "x",
  name: "X",
  priceKobo: 0,
  maxGuests: 50,
  maxUploads: 25,
  availabilityMonths: 6,
  themes: [],
  features: {},
  active: true,
  tagline: null,
  highlights: [],
  ...over,
});
const free = plan({ id: "free", key: "free", name: "Free" });
const signature = plan({
  id: "sig",
  key: "signature",
  name: "Signature",
  priceKobo: 15_000_00,
  maxGuests: UNLIMITED_GUESTS,
  maxUploads: 500,
  availabilityMonths: 18,
  features: { customTheme: true, removeBranding: true },
});
const forever = plan({
  id: "for",
  key: "forever",
  name: "Forever",
  priceKobo: 30_000_00,
  maxGuests: UNLIMITED_GUESTS,
  maxUploads: 2000,
  availabilityMonths: null,
  features: { customTheme: true, removeBranding: true, customCredit: true },
});

const view = billingView({
  wedding: { createdAt: new Date("2026-07-28T10:00:00Z"), comped: false, timezone: "Africa/Lagos", plan: signature },
  weddingDate: new Date("2026-09-19T15:00:00Z"),
  plans: [free, signature, forever],
  payments: [
    { reference: "VWL-1", amountKobo: 15_000_00, status: "SUCCESS", createdAt: new Date("2026-08-02T13:30:00Z"), paidAt: new Date("2026-08-02T13:32:00Z"), plan: { id: "sig", name: "Signature" } },
    { reference: "VWL-0", amountKobo: 15_000_00, status: "PENDING", createdAt: new Date("2026-08-02T13:20:00Z"), paidAt: null, plan: { id: "sig", name: "Signature" } },
  ],
  attendingGuests: 142,
  uploadsUsed: 212,
  paymentsEnabled: true,
  today: new Date("2026-10-01T09:00:00Z"),
});

describe("billingView", () => {
  it("offers the next plan at the price minus what's been paid", () => {
    expect(view.next).toMatchObject({ key: "forever", priceKobo: 30_000_00, chargeKobo: 15_000_00 });
    expect(view.paidKobo).toBe(15_000_00);
  });
  it("states the current plan's facts", () => {
    expect(view.current).toMatchObject({
      name: "Signature",
      paid: { amountKobo: 15_000_00, on: "2 Aug 2026" },
      closesOn: "19 Mar 2028",
      closed: false,
      window: { totalDays: 547, daysUsed: 12, daysLeft: 535 },
      guests: { attending: 142, limit: null },
      uploads: { used: 212, limit: 500 },
    });
  });
  it("shows payment times in the wedding's timezone and hides abandoned checkouts", () => {
    expect(view.payments).toEqual([{ reference: "VWL-1", planName: "Signature", amountKobo: 15_000_00, status: "SUCCESS", when: "2 Aug 2026, 14:32" }]);
  });
  it("marks the current plan's column", () => {
    expect(view.comparison.plans.map((p) => p.current)).toEqual([false, true, false]);
  });
  it("offers nothing more on the top plan", () => {
    const top = billingView({ ...{ wedding: { createdAt: new Date(), comped: true, timezone: "Africa/Lagos", plan: forever } }, weddingDate: null, plans: [free, signature, forever], payments: [], attendingGuests: 0, uploadsUsed: 0, paymentsEnabled: true });
    expect(top.next).toBeNull();
    expect(top.current?.paid).toBeNull();
  });
});
