import { describe, expect, it } from "vitest";
import { defaultPresetKey, isPresetIncluded } from "@/lib/theme-default";

const presets = [{ key: "blush-rose" }, { key: "navy-gold" }, { key: "adire-indigo" }];

describe("defaultPresetKey", () => {
  it("picks the first preset the plan includes", () => {
    expect(defaultPresetKey(["navy-gold", "adire-indigo"], presets)).toBe("navy-gold");
  });
  it("picks the first preset when the plan allows every theme", () => {
    expect(defaultPresetKey([], presets)).toBe("blush-rose");
  });
  it("falls back to the first preset when none of the plan's themes exist", () => {
    expect(defaultPresetKey(["gone"], presets)).toBe("blush-rose");
  });
});

describe("isPresetIncluded", () => {
  it("treats an empty list as every theme", () => {
    expect(isPresetIncluded([], "adire-indigo")).toBe(true);
  });
  it("checks membership otherwise", () => {
    expect(isPresetIncluded(["blush-rose"], "adire-indigo")).toBe(false);
  });
});
