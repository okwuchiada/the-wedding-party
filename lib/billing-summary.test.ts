import { describe, expect, it } from "vitest";
import { billingTimeline, onlineWindow, planComparison, planGains, type PlanTerms } from "@/lib/billing-summary";
import { UNLIMITED_GUESTS } from "@/lib/plans";

const free: PlanTerms = { key: "free", name: "Free", priceKobo: 0, maxGuests: 50, maxUploads: 25, availabilityMonths: 6, themes: ["a", "b", "c"], features: { gallery: true } };
const signature: PlanTerms = {
  key: "signature",
  name: "Signature",
  priceKobo: 15_000_00,
  maxGuests: UNLIMITED_GUESTS,
  maxUploads: 500,
  availabilityMonths: 18,
  themes: [],
  features: { gallery: true, video: true, customTheme: true, removeBranding: true },
};
const forever: PlanTerms = {
  key: "forever",
  name: "Forever",
  priceKobo: 30_000_00,
  maxGuests: UNLIMITED_GUESTS,
  maxUploads: 2000,
  availabilityMonths: null,
  themes: [],
  features: { gallery: true, video: true, customTheme: true, removeBranding: true, customCredit: true, prioritySupport: true },
};

describe("planComparison", () => {
  it("describes each plan's limits in words, one value per plan", () => {
    const rows = Object.fromEntries(planComparison([free, signature, forever]).map((r) => [r.label, r.values]));
    expect(rows["Guests who can RSVP"]).toEqual(["50", "No limit", "No limit"]);
    expect(rows["Site stays online"]).toEqual(["6 months", "18 months", "For good"]);
    expect(rows["Themes"]).toEqual(["3", "All", "All"]);
    expect(rows["Guest photo and video uploads"]).toEqual(["25", "500", "2,000"]);
    expect(rows["Footer"]).toEqual(["Vowly", "Removed", "Your own credit"]);
    expect(rows["Priority support"]).toEqual(["No", "No", "Yes"]);
  });
  it("says a single month without an s", () => {
    const rows = planComparison([{ ...free, availabilityMonths: 1 }]);
    expect(rows.find((r) => r.label === "Site stays online")?.values).toEqual(["1 month"]);
  });
});

describe("planGains", () => {
  it("lists only what changes, with the current value", () => {
    expect(planGains(signature, forever)).toEqual([
      { label: "Site stays online", value: "For good", was: "18 months" },
      { label: "Guest photo and video uploads", value: "2,000", was: "500" },
      { label: "Footer", value: "Your own credit", was: "Removed" },
      { label: "Priority support", value: "Yes", was: "No" },
    ]);
  });
  it("has no current value without a plan", () => {
    expect(planGains(null, free)[0]).toEqual({ label: "Guests who can RSVP", value: "50", was: null });
  });
});

describe("onlineWindow", () => {
  const wedding = new Date("2026-09-19T15:00:00Z");
  const closes = new Date("2028-03-19T15:00:00Z");
  it("counts whole days from the wedding to closing", () => {
    expect(onlineWindow(wedding, closes, new Date("2026-10-01T09:00:00Z"))).toEqual({ totalDays: 547, daysUsed: 12, daysLeft: 535 });
  });
  it("hasn't used any days before the wedding", () => {
    expect(onlineWindow(wedding, closes, new Date("2026-08-01T00:00:00Z"))?.daysUsed).toBe(0);
  });
  it("has no days left once closed", () => {
    expect(onlineWindow(wedding, closes, new Date("2028-04-01T00:00:00Z"))).toEqual({ totalDays: 547, daysUsed: 547, daysLeft: 0 });
  });
  it("is null for sites that stay up or have no date", () => {
    expect(onlineWindow(wedding, null, new Date())).toBeNull();
    expect(onlineWindow(null, closes, new Date())).toBeNull();
  });
});

describe("billingTimeline", () => {
  const base = {
    createdAt: new Date("2026-07-28T10:00:00Z"),
    payments: [{ date: new Date("2026-08-02T13:32:00Z"), planName: "Signature", amountKobo: 15_000_00, reference: "VWL-1" }],
    weddingDate: new Date("2026-09-19T15:00:00Z"),
    closesAt: new Date("2028-03-19T15:00:00Z"),
    today: new Date("2026-10-01T09:00:00Z"),
  };
  it("puts the site's events in date order with today among them", () => {
    expect(billingTimeline(base).map((e) => e.kind)).toEqual(["created", "paid", "wedding", "today", "closes"]);
  });
  it("shows a closed site's closing day before today", () => {
    expect(billingTimeline({ ...base, today: new Date("2028-05-01T00:00:00Z") }).map((e) => e.kind)).toEqual(["created", "paid", "wedding", "closes", "today"]);
  });
  it("ends with 'online for good' when the site never closes", () => {
    const events = billingTimeline({ ...base, closesAt: null });
    expect(events.at(-1)).toEqual({ kind: "forever", date: null });
  });
  it("leaves out the wedding day when there's no date yet", () => {
    expect(billingTimeline({ ...base, weddingDate: null, closesAt: null }).map((e) => e.kind)).toEqual(["created", "paid", "today", "forever"]);
  });
});
