import { describe, expect, it } from "vitest";
import { parseAccountProfile } from "@/lib/account-profile";

const form = (values: Record<string, string>) => (name: string) => values[name];

describe("account profile", () => {
  it("cleans the name and phone, and never reads an email", () => {
    const r = parseAccountProfile(form({ name: "  Amara   Obi ", phone: " +234 803 111 2222 ", email: "new@example.com" }));
    expect(r.data).toEqual({ name: "Amara Obi", phone: "+234 803 111 2222" });
  });
  it("allows an empty phone", () => {
    expect(parseAccountProfile(form({ name: "Amara Obi", phone: "" })).data).toEqual({ name: "Amara Obi", phone: null });
  });
  it("rejects a missing name or a bad phone", () => {
    expect(parseAccountProfile(form({ name: "A" })).error).toBe("Enter your full name");
    expect(parseAccountProfile(form({ name: "Amara Obi", phone: "abc123" })).error).toMatch(/phone number/);
  });
});
