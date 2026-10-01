export const MAX_PARTY_SIZE = 10;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Input = { name: unknown; email: unknown; attending: unknown; partySize: unknown; message: unknown };
type Data = { guestName: string; email: string; attending: boolean; guestCount: number; message: string | null };

/** Validates a guest's RSVP form. Email is optional; declines always count as one reply. */
export function parseGuestRsvp(input: Input): { error: string } | { data: Data } {
  const guestName = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  if (!guestName) return { error: "Please enter your name" };

  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (email && !EMAIL_REGEX.test(email)) return { error: "Please check your email address" };

  if (input.attending !== "yes" && input.attending !== "no") return { error: "Please let us know if you can make it" };
  const attending = input.attending === "yes";

  const raw = typeof input.partySize === "string" && input.partySize.trim() ? Number(input.partySize) : 1;
  if (!Number.isInteger(raw) || raw < 1 || raw > MAX_PARTY_SIZE) return { error: `Party size must be between 1 and ${MAX_PARTY_SIZE}` };

  const message = typeof input.message === "string" ? input.message.trim() : "";
  return { data: { guestName, email, attending, guestCount: attending ? raw : 1, message: message || null } };
}

type AdminInput = { guestName: unknown; email: unknown; attending: unknown; message: unknown };
type AdminData = { guestName: string; email: string; attending: boolean; message: string | null };

/**
 * Validates an RSVP the couple adds, edits or imports. Email is optional (phone
 * calls, paper lists; stored as ""). It carries no party size: new rows get the
 * default of 1 and existing rows keep what the guest chose.
 */
export function parseAdminRsvp(input: AdminInput): { error: string } | { data: AdminData } {
  const guestName = typeof input.guestName === "string" ? input.guestName.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (!guestName) return { error: "Name is required" };
  if (email && !EMAIL_REGEX.test(email)) return { error: `Invalid email "${email}"` };
  if (typeof input.attending !== "boolean") return { error: "Attending must be yes or no" };

  return { data: { guestName, email, attending: input.attending, message: message || null } };
}
