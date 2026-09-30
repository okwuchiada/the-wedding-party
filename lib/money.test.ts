import { describe, expect, it } from "vitest";
import { currencySymbol, formatMoney, localeLabel } from "@/lib/money";

describe("formatMoney", () => {
  it("matches the original naira formatting", () => {
    expect(formatMoney(500_000_00, { currency: "NGN", locale: "en-NG" })).toBe("₦500,000");
  });

  it("shows decimals only when needed", () => {
    expect(formatMoney(1999, { currency: "USD", locale: "en-US" })).toBe("$19.99");
    expect(formatMoney(2000, { currency: "GBP", locale: "en-GB" })).toBe("£20");
  });

  it("finds the currency symbol", () => {
    expect(currencySymbol({ currency: "NGN", locale: "en-NG" })).toBe("₦");
    expect(currencySymbol({ currency: "EUR", locale: "fr-FR" })).toBe("€");
  });
});

describe("localeLabel", () => {
  it("names the country and shows a sample", () => {
    expect(localeLabel("en-NG", "NGN")).toBe("Nigeria · ₦1,234.56");
    expect(localeLabel("en-GB", "GBP")).toBe("United Kingdom · £1,234.56");
  });
});
