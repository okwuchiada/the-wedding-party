import { phoneOk } from "@/lib/staff-profile";

// A couple's account details (Your account). The sign-in email is deliberately
// not here: it can't be changed.

export type AccountProfileInput = { name: string; phone: string | null };

export function parseAccountProfile(get: (name: string) => unknown): { data: AccountProfileInput; error?: undefined } | { error: string; data?: undefined } {
  const clean = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");
  const name = clean(get("name"));
  const phone = clean(get("phone"));
  if (name.length < 2) return { error: "Enter your full name" };
  if (name.length > 100) return { error: "Your name is too long (max 100 characters)" };
  if (phone && (phone.length > 20 || !phoneOk(phone))) return { error: "Enter a phone number with at least 7 digits, e.g. +234 803 123 4567" };
  return { data: { name, phone: phone || null } };
}
