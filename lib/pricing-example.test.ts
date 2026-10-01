import { describe, expect, it } from "vitest";
import { upgradeExample } from "@/lib/pricing-example";

const plan = (name: string, priceKobo: number, maxGuests = 100, features: Record<string, boolean> = {}) => ({
  id: name,
  name,
  priceKobo,
  maxGuests,
  features,
  active: true,
});

describe("upgradeExample", () => {
  it("uses the two cheapest paid plans and charges the difference", () => {
    const example = upgradeExample([plan("Free", 0), plan("Forever", 3_000_000, 500), plan("Signature", 1_500_000, 300)]);
    expect(example).toEqual({ first: "Signature", firstKobo: 1_500_000, second: "Forever", secondKobo: 3_000_000, chargeKobo: 1_500_000 });
  });
  it("needs two paid plans", () => {
    expect(upgradeExample([plan("Free", 0), plan("Signature", 1_500_000)])).toBeNull();
  });
  it("skips a pricier plan that adds nothing", () => {
    expect(upgradeExample([plan("A", 1_000_000, 100), plan("B", 2_000_000, 100)])).toBeNull();
  });
});
