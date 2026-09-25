import { describe, expect, it } from "vitest";
import { PASSWORD_REGEX, passwordStrength, validatePassword } from "@/lib/password-rules";

describe("validatePassword", () => {
  it("names the first missing requirement", () => {
    expect(validatePassword("")).toMatch(/at least 8/);
    expect(validatePassword("Ab1!")).toMatch(/at least 8/);
    expect(validatePassword("ABCDEFG1!")).toMatch(/lowercase/);
    expect(validatePassword("abcdefg1!")).toMatch(/uppercase/);
    expect(validatePassword("Abcdefgh!")).toMatch(/number/);
    expect(validatePassword("Abcdefgh1")).toMatch(/symbol/);
    expect(validatePassword("Abcdef g1")).toMatch(/symbol/); // a space isn't a symbol
    expect(validatePassword(`Aa1!${"x".repeat(200)}`)).toMatch(/too long/);
    expect(validatePassword(123)).toMatch(/at least 8/);
  });

  it("accepts passwords that meet every rule, and agrees with the regex", () => {
    for (const pw of ["Tobi&Ada2027", "k9#Lagoon-sunset", "Aa1!aaaa"]) {
      expect(validatePassword(pw)).toBeNull();
      expect(PASSWORD_REGEX.test(pw)).toBe(true);
    }
    for (const pw of ["short1A!", "no-upper-1!", "NO-LOWER-1!", "NoNumber!!", "NoSymbol12"]) {
      expect(validatePassword(pw) === null).toBe(PASSWORD_REGEX.test(pw));
    }
  });
});

describe("passwordStrength", () => {
  const label = (pw: string) => passwordStrength(pw).label;

  it("is empty for an empty field", () => {
    expect(passwordStrength("")).toMatchObject({ score: 0, label: "", valid: false });
  });

  it("rates passwords that miss a rule as Weak or Fair", () => {
    expect(label("abc")).toBe("Weak");
    expect(label("abcdefgh")).toBe("Weak");
    expect(label("kqzmwxH1")).toBe("Fair");
    expect(label("abcdefgH1")).toBe("Weak"); // "abcd" is a predictable run
  });

  it("rates valid passwords by length and predictability", () => {
    expect(label("Tobi&Ada27")).toBe("Good");
    expect(label("Tobi&Ada2027!")).toBe("Good");
    expect(label("k9#Lagoon-sunset-Ikoyi")).toBe("Strong");
  });

  it("marks down common patterns even when the rules pass", () => {
    expect(label("Password123!")).toBe("Fair"); // valid, but among the first guesses
    expect(label("Aaaa1111!!!!")).toBe("Fair");
    expect(passwordStrength("Password123!").score).toBeLessThan(passwordStrength("Tq7#vLm2pZ9!").score);
    expect(passwordStrength("Password123!").valid).toBe(true); // still allowed
  });

  it("reports which rules are met", () => {
    const { rules } = passwordStrength("abc1");
    expect(Object.fromEntries(rules.map((r) => [r.id, r.met]))).toEqual({
      length: false, lower: true, upper: false, number: true, symbol: false,
    });
  });
});

describe("missingRequirements", () => {
  it("lists what's missing in plain words", async () => {
    const { missingRequirements } = await import("@/lib/password-rules");
    expect(missingRequirements("Tobi&Ada27")).toBeNull();
    expect(missingRequirements("tobiada27")).toBe("an uppercase letter and a symbol, like ! or #");
    expect(missingRequirements("")).toBe(
      "at least 8 characters, a lowercase letter, an uppercase letter, a number and a symbol, like ! or #"
    );
  });
});
