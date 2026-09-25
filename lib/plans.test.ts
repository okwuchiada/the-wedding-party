import { describe, expect, it } from "vitest";
import { hasFeature } from "@/lib/plans";

describe("hasFeature", () => {
  it("reads boolean flags from the plan", () => {
    expect(hasFeature({ features: { gallery: true } }, "gallery")).toBe(true);
    expect(hasFeature({ features: { gallery: false } }, "gallery")).toBe(false);
    expect(hasFeature({ features: { gallery: "yes" } }, "gallery")).toBe(false);
  });

  it("treats a missing plan as no features", () => {
    expect(hasFeature(null, "gallery")).toBe(false);
    expect(hasFeature({ features: null }, "removeBranding")).toBe(false);
  });
});

describe("plan limits", () => {
  it("counts availability from the wedding date, and never overflows a short month", async () => {
    const { siteClosesAt, siteHasClosed } = await import("@/lib/plans");
    const wedding = new Date("2026-12-19T15:00:00Z");
    expect(siteClosesAt({ availabilityMonths: 6 }, wedding)?.toISOString()).toBe("2027-06-19T15:00:00.000Z");
    expect(siteClosesAt({ availabilityMonths: 6 }, new Date("2026-08-31T00:00:00Z"))?.toISOString()).toBe("2027-02-28T00:00:00.000Z");
    expect(siteClosesAt({ availabilityMonths: null }, wedding)).toBeNull();
    expect(siteClosesAt({ availabilityMonths: 6 }, null)).toBeNull();
    expect(siteHasClosed({ availabilityMonths: 6 }, wedding, new Date("2027-06-19T14:59:59Z"))).toBe(false);
    expect(siteHasClosed({ availabilityMonths: 6 }, wedding, new Date("2027-06-19T15:00:00Z"))).toBe(true);
    expect(siteHasClosed({ availabilityMonths: null }, wedding, new Date("2090-01-01"))).toBe(false);
  });

  it("limits themes only when the plan lists them", async () => {
    const { planAllowsTheme } = await import("@/lib/plans");
    expect(planAllowsTheme({ themes: [] }, "monochrome")).toBe(true);
    expect(planAllowsTheme({ themes: ["navy-gold"] }, "navy-gold")).toBe(true);
    expect(planAllowsTheme({ themes: ["navy-gold"] }, "monochrome")).toBe(false);
  });

  it("counts uploads left, with no limit when unset", async () => {
    const { uploadsLeft, guestLimitLabel, UNLIMITED_GUESTS } = await import("@/lib/plans");
    expect(uploadsLeft({ maxUploads: 25 }, 20)).toBe(5);
    expect(uploadsLeft({ maxUploads: 25 }, 30)).toBe(0);
    expect(uploadsLeft({ maxUploads: null }, 9999)).toBeNull();
    expect(guestLimitLabel(50)).toBe("Up to 50 guests");
    expect(guestLimitLabel(UNLIMITED_GUESTS)).toBe("Unlimited guests");
  });
});
