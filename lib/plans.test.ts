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
