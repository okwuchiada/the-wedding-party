import { describe, expect, it } from "vitest";
import { capacityError, guestCapacity, seatChangeError, seatsLeft } from "@/lib/capacity";

describe("guestCapacity", () => {
  it("uses the smaller of the wedding's and the plan's limit", () => {
    expect(guestCapacity(300, 500)).toBe(300);
    expect(guestCapacity(300, 100)).toBe(100);
  });
  it("uses the wedding's limit when there's no plan", () => {
    expect(guestCapacity(120, null)).toBe(120);
  });
});

describe("seatsLeft", () => {
  it("never goes below zero", () => {
    expect(seatsLeft(100, 98)).toBe(2);
    expect(seatsLeft(100, 130)).toBe(0);
  });
});

describe("capacityError", () => {
  it("allows a party that fits", () => {
    expect(capacityError(2, 2)).toBeNull();
  });
  it("says how many places are left when the party is too big", () => {
    expect(capacityError(4, 2)).toBe("Only 2 places are left. Please reduce your party size.");
    expect(capacityError(3, 1)).toBe("Only 1 place is left. Please reduce your party size.");
  });
  it("says the wedding is full when nothing is left", () => {
    expect(capacityError(1, 0)).toBe("Sorry, we've reached full capacity and can no longer accept RSVPs.");
  });
});

describe("seatChangeError", () => {
  it("refuses a new attending party that doesn't fit", () => {
    expect(seatChangeError({ attending: true, partySize: 10, seatsBefore: 0, taken: 49, capacity: 50 })).toMatch(/Only 1 place is left/);
  });
  it("seats a new party that fits", () => {
    expect(seatChangeError({ attending: true, partySize: 1, seatsBefore: 0, taken: 49, capacity: 50 })).toBeNull();
  });
  it("counts the RSVP's own seats as free when it grows", () => {
    expect(seatChangeError({ attending: true, partySize: 4, seatsBefore: 3, taken: 50, capacity: 51 })).toBeNull();
    expect(seatChangeError({ attending: true, partySize: 5, seatsBefore: 3, taken: 50, capacity: 51 })).toMatch(/Only 4 places/);
  });
  it("never refuses a party that shrinks or declines, even over capacity", () => {
    expect(seatChangeError({ attending: true, partySize: 2, seatsBefore: 3, taken: 60, capacity: 50 })).toBeNull();
    expect(seatChangeError({ attending: false, partySize: 9, seatsBefore: 0, taken: 50, capacity: 50 })).toBeNull();
  });
});
