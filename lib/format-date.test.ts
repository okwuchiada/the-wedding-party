import { describe, expect, it } from "vitest";
import { shortDate } from "@/lib/format-date";

describe("shortDate", () => {
  it("writes the day first with a short month", () => {
    expect(shortDate("2026-06-12")).toBe("12 Jun 2026");
  });
  it("keeps the stored calendar date whatever the viewer's timezone", () => {
    expect(shortDate("2026-12-31T23:30:00.000Z")).toBe("31 Dec 2026");
  });
});
