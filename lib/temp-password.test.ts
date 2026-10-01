import { describe, expect, it } from "vitest";
import { validatePassword } from "@/lib/password-rules";
import { generateTempPassword, looksLikeTempPassword, TEMP_PASSWORD_PREFIX, tempPasswordExpiry } from "@/lib/temp-password";

describe("temporary passwords", () => {
  it("are recognisable, meet the password rules and differ each time", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const pw = generateTempPassword();
      expect(pw).toMatch(/^Vowly-Temp-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/);
      expect(pw.slice(TEMP_PASSWORD_PREFIX.length)).not.toMatch(/[0O1lI]/);
      expect(validatePassword(pw)).toBeNull();
      expect(looksLikeTempPassword(pw)).toBe(true);
      seen.add(pw);
    }
    expect(seen.size).toBe(200);
  });

  it("recognises the prefix in any case, and not ordinary passwords", () => {
    expect(looksLikeTempPassword(`${TEMP_PASSWORD_PREFIX.toUpperCase()}abcd`)).toBe(true);
    expect(looksLikeTempPassword("MyOwn!Pass9")).toBe(false);
  });

  it("expire after 7 days", () => {
    const from = new Date("2026-10-01T10:00:00Z");
    expect(tempPasswordExpiry(from).toISOString()).toBe("2026-10-08T10:00:00.000Z");
  });
});
