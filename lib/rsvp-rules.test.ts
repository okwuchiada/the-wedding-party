import { describe, expect, it } from "vitest";
import { MAX_PARTY_SIZE, parseAdminRsvp, parseGuestRsvp, parsePartySizeLimit } from "@/lib/rsvp-rules";

const base = { name: "Ngozi Adeyemi", email: "ngozi@example.com", attending: "yes", partySize: "2", message: "" };

describe("parseGuestRsvp", () => {
  it("accepts a full reply", () => {
    expect(parseGuestRsvp(base)).toEqual({
      data: { guestName: "Ngozi Adeyemi", email: "ngozi@example.com", attending: true, guestCount: 2, message: null },
    });
  });
  it("accepts a reply with no email", () => {
    const result = parseGuestRsvp({ ...base, email: "" });
    expect("data" in result && result.data.email).toBe("");
  });
  it("rejects a malformed email", () => {
    expect(parseGuestRsvp({ ...base, email: "ngozi@" })).toEqual({ error: "Please check your email address" });
  });
  it("needs a name", () => {
    expect(parseGuestRsvp({ ...base, name: "  " })).toEqual({ error: "Please enter your name" });
  });
  it("needs a yes or no", () => {
    expect(parseGuestRsvp({ ...base, attending: null })).toEqual({ error: "Please let us know if you can make it" });
  });
  it("keeps party size between 1 and the maximum", () => {
    expect(parseGuestRsvp({ ...base, partySize: "0" })).toEqual({ error: `Party size must be between 1 and ${MAX_PARTY_SIZE}` });
    expect(parseGuestRsvp({ ...base, partySize: String(MAX_PARTY_SIZE + 1) })).toEqual({ error: `Party size must be between 1 and ${MAX_PARTY_SIZE}` });
  });
  it("counts a decline as one reply regardless of party size", () => {
    const result = parseGuestRsvp({ ...base, attending: "no", partySize: "5" });
    expect("data" in result && result.data.guestCount).toBe(1);
  });
  it("defaults a missing party size to 1", () => {
    const result = parseGuestRsvp({ ...base, partySize: null });
    expect("data" in result && result.data.guestCount).toBe(1);
  });
});

describe("parseAdminRsvp", () => {
  const row = { guestName: "Ngozi Adeyemi", email: "", attending: true, message: "" };

  it("never carries a party size, so editing or re-importing keeps the guest's own", () => {
    const result = parseAdminRsvp(row);
    expect("data" in result && "guestCount" in result.data).toBe(false);
  });
  it("still validates name, email and attending", () => {
    expect(parseAdminRsvp({ ...row, guestName: " " })).toEqual({ error: "Name is required" });
    expect(parseAdminRsvp({ ...row, email: "x@" })).toEqual({ error: 'Invalid email "x@"' });
    expect(parseAdminRsvp({ ...row, attending: "maybe" })).toEqual({ error: "Attending must be yes or no" });
  });
});

describe("parseGuestRsvp with the couple's guests-per-RSVP limit", () => {
  it("accepts a party within the limit", () => {
    const result = parseGuestRsvp({ ...base, partySize: "3" }, 3);
    expect("data" in result && result.data.guestCount).toBe(3);
  });
  it("refuses a party over the limit", () => {
    expect(parseGuestRsvp({ ...base, partySize: "4" }, 3)).toEqual({ error: "Each reply can include up to 3 people, including you" });
  });
  it("says a one-guest invitation plainly", () => {
    expect(parseGuestRsvp({ ...base, partySize: "2" }, 1)).toEqual({ error: "This invitation is for one guest" });
  });
  it("counts a one-guest reply with no party size as one", () => {
    const result = parseGuestRsvp({ ...base, partySize: "" }, 1);
    expect("data" in result && result.data.guestCount).toBe(1);
  });
  it("still lets a guest decline whatever the limit", () => {
    const result = parseGuestRsvp({ ...base, attending: "no", partySize: "1" }, 1);
    expect("data" in result && result.data.attending).toBe(false);
  });
});

describe("parsePartySizeLimit", () => {
  it("accepts 1 to the maximum", () => {
    expect(parsePartySizeLimit("1")).toEqual({ value: 1 });
    expect(parsePartySizeLimit(String(MAX_PARTY_SIZE))).toEqual({ value: MAX_PARTY_SIZE });
  });
  it("refuses anything else", () => {
    for (const bad of ["0", "11", "2.5", "", "abc"]) {
      expect(parsePartySizeLimit(bad)).toEqual({ error: `Guests per RSVP should be a whole number from 1 to ${MAX_PARTY_SIZE}` });
    }
  });
});
