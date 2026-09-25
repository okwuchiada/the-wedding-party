import { describe, expect, it } from "vitest";
import { easterSunday, holidayOn, nigerianHolidays } from "@/lib/ng-holidays";

describe("Nigerian public holidays", () => {
  it("calculates Easter Sunday", () => {
    expect(easterSunday(2026).toISOString().slice(0, 10)).toBe("2026-04-05");
    expect(easterSunday(2027).toISOString().slice(0, 10)).toBe("2027-03-28");
    expect(easterSunday(2028).toISOString().slice(0, 10)).toBe("2028-04-16");
    expect(easterSunday(2038).toISOString().slice(0, 10)).toBe("2038-04-25"); // latest possible
  });

  it("marks Good Friday and Easter Monday", () => {
    expect(holidayOn("2027-03-26")).toBe("Good Friday");
    expect(holidayOn("2027-03-29")).toBe("Easter Monday");
    expect(holidayOn("2028-04-14")).toBe("Good Friday");
  });

  it("marks fixed-date holidays and nothing else", () => {
    expect(holidayOn("2027-06-12")).toBe("Democracy Day");
    expect(holidayOn("2027-10-01")).toBe("Independence Day");
    expect(holidayOn("2027-03-20")).toBeNull();
    expect(nigerianHolidays(2030).size).toBe(8);
  });
});
