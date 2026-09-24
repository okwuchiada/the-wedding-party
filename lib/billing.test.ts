import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { paymentMatches, upgradeCharge } from "@/lib/billing";

vi.mock("server-only", () => ({}));
const { verifyPaystackSignature } = await import("@/lib/paystack");

const basic = { id: "basic", priceKobo: 25_000_00, active: true, maxGuests: 150, features: { gallery: false } };
const premium = { id: "premium", priceKobo: 60_000_00, active: true, maxGuests: 500, features: { gallery: true } };
const legacy = { id: "legacy", priceKobo: 0, active: false, maxGuests: 100_000, features: { gallery: true, customTheme: true } };

describe("upgradeCharge", () => {
  it("charges the full price for a first plan", () => {
    expect(upgradeCharge(basic, null, 0)).toBe(25_000_00);
  });
  it("charges the difference when upgrading", () => {
    expect(upgradeCharge(premium, basic, 25_000_00)).toBe(35_000_00);
  });
  it("charges the full price when the current plan was comped", () => {
    expect(upgradeCharge(premium, basic, 0)).toBe(60_000_00);
  });
  it("doesn't sell a plan that adds nothing to the current one", () => {
    expect(upgradeCharge(premium, legacy, 0)).toBeNull();
  });
  it("refuses downgrades, sidegrades and retired plans", () => {
    expect(upgradeCharge(basic, premium, 60_000_00)).toBeNull();
    expect(upgradeCharge(basic, basic, 25_000_00)).toBeNull();
    expect(upgradeCharge({ ...premium, active: false }, null, 0)).toBeNull();
  });
});

describe("paymentMatches", () => {
  const expected = { reference: "wp_1", amountKobo: 25_000_00, currency: "NGN" };
  it("accepts an exact successful charge", () => {
    expect(paymentMatches(expected, { status: "success", reference: "wp_1", amount: 25_000_00, currency: "NGN" })).toBe(true);
  });
  it("rejects anything else", () => {
    expect(paymentMatches(expected, { status: "failed", reference: "wp_1", amount: 25_000_00, currency: "NGN" })).toBe(false);
    expect(paymentMatches(expected, { status: "success", reference: "wp_1", amount: 100_00, currency: "NGN" })).toBe(false);
    expect(paymentMatches(expected, { status: "success", reference: "wp_1", amount: 25_000_00, currency: "USD" })).toBe(false);
    expect(paymentMatches(expected, { status: "success", reference: "wp_2", amount: 25_000_00, currency: "NGN" })).toBe(false);
  });
});

describe("verifyPaystackSignature", () => {
  const body = JSON.stringify({ event: "charge.success", data: { reference: "wp_1" } });
  const sign = (b: string, key: string) => createHmac("sha512", key).update(b).digest("hex");

  it("accepts Paystack's HMAC-SHA512 signature", () => {
    expect(verifyPaystackSignature(body, sign(body, "sk_test_x"), "sk_test_x")).toBe(true);
  });
  it("rejects tampered bodies, wrong keys and missing signatures", () => {
    expect(verifyPaystackSignature(body.replace("wp_1", "wp_2"), sign(body, "sk_test_x"), "sk_test_x")).toBe(false);
    expect(verifyPaystackSignature(body, sign(body, "sk_other"), "sk_test_x")).toBe(false);
    expect(verifyPaystackSignature(body, null, "sk_test_x")).toBe(false);
    expect(verifyPaystackSignature(body, sign(body, "sk_test_x"), undefined)).toBe(false);
  });
});
