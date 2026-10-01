import { describe, expect, it } from "vitest";
import { formatNavDate } from "@/lib/nav-date";

describe("formatNavDate", () => {
  it("puts the day before the month", () => {
    expect(formatNavDate("2026-12-12T13:00:00.000Z")).toBe("SAT 12 DEC");
  });
  it("uses the stored calendar date, not the viewer's timezone", () => {
    expect(formatNavDate("2026-12-12T23:30:00.000Z")).toBe("SAT 12 DEC");
  });
});
