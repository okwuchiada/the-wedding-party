import { describe, expect, it } from "vitest";
import { isTransferReference, REFERENCE_ALPHABET, transferReference } from "@/lib/transfer-reference";

/** A random() that returns each value in turn. */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("transferReference", () => {
  it("uses up to five letters of the gift's first word and six code characters", () => {
    expect(transferReference("Honeymoon fund", seq(0))).toBe(`HONEY-${REFERENCE_ALPHABET[0].repeat(6)}`);
    expect(transferReference("TV", seq(0))).toMatch(/^TV-[A-Z2-9]{6}$/);
  });
  it("falls back to GIFT when the name has no letters", () => {
    expect(transferReference("2025", seq(0))).toMatch(/^GIFT-/);
    expect(transferReference("🎁", seq(0))).toMatch(/^GIFT-/);
  });
  it("drops accents", () => {
    expect(transferReference("Éclair set", seq(0))).toMatch(/^ECLAI-/);
  });
  it("never uses characters people confuse when typing into a bank app", () => {
    expect(REFERENCE_ALPHABET).not.toMatch(/[01OIL]/);
    const code = transferReference("Fridge", seq(0.999, 0.5, 0.25, 0.1, 0.75, 0.33)).split("-")[1];
    expect(code).toHaveLength(6);
    for (const ch of code) expect(REFERENCE_ALPHABET).toContain(ch);
  });
  it("makes clashes rare across a thousand gifts to one item", () => {
    const seen = new Set(Array.from({ length: 1000 }, () => transferReference("Honeymoon")));
    expect(seen.size).toBeGreaterThan(995);
  });
});

describe("isTransferReference", () => {
  it("accepts generated references only", () => {
    expect(isTransferReference(transferReference("Honeymoon"))).toBe(true);
    expect(isTransferReference("HONEY-4827")).toBe(false);
    expect(isTransferReference("honey-ABCDEF")).toBe(false);
    expect(isTransferReference("HONEYMOON-ABCDEF")).toBe(false);
    expect(isTransferReference("HONEY-ABCDE0")).toBe(false);
  });
});
