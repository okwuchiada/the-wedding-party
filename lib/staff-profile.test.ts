import { describe, expect, it } from "vitest";
import { ageOn, changedFields, parseStaffProfile } from "@/lib/staff-profile";

const countries = new Set(["NG", "GB", "GH"]);
const today = new Date("2026-10-01T12:00:00Z");
const form = (values: Record<string, string>) => (name: string) => values[name];

describe("staff profile", () => {
  it("accepts a full profile and cleans it", () => {
    const r = parseStaffProfile(
      form({
        fullName: "  Ada   Okwuchi ", preferredName: "Ada", jobTitle: "Support lead", phone: "+234 803 123 4567",
        dateOfBirth: "1995-04-12", gender: "female", nationality: "ng", addressLine: "12 Allen Avenue", city: "Ikeja",
        state: "Lagos", country: "NG", emergencyName: "Chidi Okwuchi", emergencyRelationship: "Brother", emergencyPhone: "08031234567",
      }),
      countries,
      today
    );
    expect(r.error).toBeUndefined();
    expect(r.data).toMatchObject({ fullName: "Ada Okwuchi", nationality: "NG", gender: "female" });
    expect(r.data?.dateOfBirth?.toISOString()).toBe("1995-04-12T00:00:00.000Z");
  });

  it("needs only a full name; empty fields become null", () => {
    const r = parseStaffProfile(form({ fullName: "Tobi Ade", phone: "  " }), countries, today);
    expect(r.data).toMatchObject({ fullName: "Tobi Ade", phone: null, dateOfBirth: null, emergencyName: null });
  });

  it("rejects bad values with a plain message", () => {
    const check = (values: Record<string, string>) => parseStaffProfile(form({ fullName: "Tobi Ade", ...values }), countries, today).error;
    expect(parseStaffProfile(form({}), countries, today).error).toBe("Enter your full name");
    expect(check({ phone: "12ab" })).toMatch(/phone number/);
    expect(check({ nationality: "US" })).toMatch(/nationality from the list/);
    expect(check({ country: "ZZ" })).toMatch(/country from the list/);
    expect(check({ gender: "robot" })).toMatch(/gender/);
    expect(check({ dateOfBirth: "2015-01-01" })).toMatch(/16 or older/);
    expect(check({ dateOfBirth: "31/12/1990" })).toMatch(/valid date/);
    expect(check({ emergencyRelationship: "Sister" })).toMatch(/name and phone/);
    expect(check({ jobTitle: "x".repeat(81) })).toMatch(/too long/);
  });

  it("counts age by birthday", () => {
    expect(ageOn(new Date("2010-10-01T00:00:00Z"), today)).toBe(16);
    expect(ageOn(new Date("2010-10-02T00:00:00Z"), today)).toBe(15);
  });

  it("lists changed fields by name only", () => {
    const after = parseStaffProfile(form({ fullName: "Ada Okwuchi", phone: "+2348031234567", dateOfBirth: "1995-04-12" }), countries, today).data!;
    expect(changedFields({ fullName: "Ada Okwuchi", phone: null, dateOfBirth: new Date("1995-04-12T00:00:00Z") }, after)).toEqual(["phone"]);
  });
});
