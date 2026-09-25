import { describe, expect, it } from "vitest";
import { canLoadMore, MAX_SHOWN, SHOWN_STEP, shownParam } from "@/lib/shown-param";

describe("shownParam", () => {
  it("starts with one page", () => {
    expect(shownParam(undefined)).toBe(SHOWN_STEP);
  });
  it("reads a larger count", () => {
    expect(shownParam("48")).toBe(48);
  });
  it("ignores junk and keeps within bounds", () => {
    expect(shownParam("abc")).toBe(SHOWN_STEP);
    expect(shownParam("-5")).toBe(SHOWN_STEP);
    expect(shownParam("100000")).toBe(500);
    expect(shownParam(["48", "72"])).toBe(SHOWN_STEP);
  });
});

describe("canLoadMore", () => {
  it("offers more while items remain", () => {
    expect(canLoadMore(30, 24)).toBe(true);
    expect(canLoadMore(24, 24)).toBe(false);
  });
  it("stops offering a link that can't load anything past the cap", () => {
    expect(canLoadMore(900, MAX_SHOWN)).toBe(false);
  });
});
