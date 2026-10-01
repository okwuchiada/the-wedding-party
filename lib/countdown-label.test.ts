import { describe, expect, it } from "vitest";
import { countdownLabel } from "@/lib/countdown-label";

const now = new Date("2026-09-29T10:00:00Z");

describe("countdownLabel", () => {
  it("counts whole days to go", () => {
    expect(countdownLabel(new Date("2026-12-12T14:00:00Z"), now)).toBe("74 days to go");
  });
  it("says tomorrow and today", () => {
    expect(countdownLabel(new Date("2026-09-30T14:00:00Z"), now)).toBe("Tomorrow");
    expect(countdownLabel(new Date("2026-09-29T18:00:00Z"), now)).toBe("Today");
  });
  it("gives the date once the wedding has passed", () => {
    expect(countdownLabel(new Date("2026-09-12T14:00:00Z"), now)).toBe("Married 12 Sept 2026");
  });
});
