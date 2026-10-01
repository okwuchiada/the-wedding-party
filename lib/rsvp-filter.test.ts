import { describe, expect, it } from "vitest";
import { filterRsvps, rsvpFilterCounts } from "@/lib/rsvp-filter";

const r = (guestName: string, attending: boolean, email = "", confirmationSentAt: string | null = null) => ({ guestName, email, attending, confirmationSentAt });
const list = [
  r("Ngozi Adeyemi", true, "ngozi@example.com", "2026-09-14"),
  r("Femi Bello", false),
  r("Kelechi Obi", true, "kc@example.com"),
  r("Amaka Nwosu", true),
];

describe("filterRsvps", () => {
  it("matches name or email, ignoring case and spaces", () => {
    expect(filterRsvps(list, "  NGOZI ", "all").map((x) => x.guestName)).toEqual(["Ngozi Adeyemi"]);
    expect(filterRsvps(list, "kc@", "all").map((x) => x.guestName)).toEqual(["Kelechi Obi"]);
  });
  it("filters by reply and email state", () => {
    expect(filterRsvps(list, "", "declined").map((x) => x.guestName)).toEqual(["Femi Bello"]);
    expect(filterRsvps(list, "", "noEmail").map((x) => x.guestName)).toEqual(["Femi Bello", "Amaka Nwosu"]);
    expect(filterRsvps(list, "", "notConfirmed").map((x) => x.guestName)).toEqual(["Kelechi Obi"]);
  });
  it("combines search and filter", () => {
    expect(filterRsvps(list, "ade", "attending").map((x) => x.guestName)).toEqual(["Ngozi Adeyemi"]);
    expect(filterRsvps(list, "ade", "declined")).toEqual([]);
  });
});

describe("rsvpFilterCounts", () => {
  it("counts each filter", () => {
    expect(rsvpFilterCounts(list)).toEqual({ all: 4, attending: 3, declined: 1, noEmail: 2, notConfirmed: 1 });
  });
});
