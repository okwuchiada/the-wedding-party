import { describe, expect, it } from "vitest";
import { creditUpgradeNotice } from "@/lib/credit-notice";

describe("creditUpgradeNotice", () => {
  it("names both plans when the credit is still shown", () => {
    expect(creditUpgradeNotice({ brandingRemoved: false, brandingPlan: "Premium", creditPlan: "Forever" })).toBe(
      "Your plan shows “Made with love by Vowly”. Upgrade to Premium to remove it, or to Forever to credit someone of your choice."
    );
  });
  it("only offers a custom credit once branding is already off", () => {
    expect(creditUpgradeNotice({ brandingRemoved: true, brandingPlan: "Premium", creditPlan: "Forever" })).toBe(
      "Your plan leaves the footer credit off. Upgrade to Forever to credit someone of your choice."
    );
  });
  it("uses whatever the plans are called now", () => {
    expect(creditUpgradeNotice({ brandingRemoved: false, brandingPlan: "Gold", creditPlan: "Gold" })).toBe(
      "Your plan shows “Made with love by Vowly”. Upgrade to Gold to remove it or credit someone of your choice."
    );
  });
  it("leaves out upgrades no plan offers", () => {
    expect(creditUpgradeNotice({ brandingRemoved: false, brandingPlan: null, creditPlan: null })).toBe(
      "Your plan shows “Made with love by Vowly”."
    );
  });
});
