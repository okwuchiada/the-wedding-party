import { describe, expect, it } from "vitest";
import { bankDetailsError, NG_BANKS, normaliseAccountNumber } from "@/lib/bank-account";

const ok = { currency: "NGN", name: "Ifeoma Okafor", bank: "Access Bank", account: "0123456789" };

describe("normaliseAccountNumber", () => {
  it("strips spaces and dashes", () => {
    expect(normaliseAccountNumber(" 0123 456-789 ")).toBe("0123456789");
  });
});

describe("bankDetailsError", () => {
  it("accepts a 10-digit naira account", () => {
    expect(bankDetailsError(ok)).toBeNull();
  });
  it("accepts spaced digits once normalised", () => {
    expect(bankDetailsError({ ...ok, account: "0123 456 789" })).toBeNull();
  });
  it("rejects a naira account that isn't 10 digits", () => {
    expect(bankDetailsError({ ...ok, account: "12345" })).toBe("Nigerian account numbers have 10 digits");
    expect(bankDetailsError({ ...ok, account: "01234567AB" })).toBe("Nigerian account numbers have 10 digits");
  });
  it("allows other formats for other currencies", () => {
    expect(bankDetailsError({ ...ok, currency: "GBP", account: "GB29 NWBK 6016 1331 9268 19" })).toBeNull();
  });
  it("needs a name and a bank", () => {
    expect(bankDetailsError({ ...ok, name: " " })).toBe("Account name is required");
    expect(bankDetailsError({ ...ok, bank: "" })).toBe("Choose your bank");
  });
});

describe("NG_BANKS", () => {
  it("is sorted and has no duplicates", () => {
    expect([...NG_BANKS].sort((a, b) => a.localeCompare(b))).toEqual([...NG_BANKS]);
    expect(new Set(NG_BANKS).size).toBe(NG_BANKS.length);
  });
});
