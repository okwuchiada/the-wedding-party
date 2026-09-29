import { randomInt } from "node:crypto";

// Temporary passwords for accounts created by someone else (e.g. new staff).
// They're marked in the database (User.mustChangePassword) and expire; the
// fixed "Vowly-Temp-" prefix just makes them easy to recognise in the email.

export const TEMP_PASSWORD_PREFIX = "Vowly-Temp-";
export const TEMP_PASSWORD_DAYS = 7;

// No look-alikes (0/O, 1/l/I), so it can be typed from the email.
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const ALL = LOWER + UPPER + DIGITS;

const pick = (alphabet: string) => alphabet[randomInt(alphabet.length)];

/** e.g. "Vowly-Temp-k7Qm-X3pa-9HwR": three random groups (~70 bits), meeting every password rule. */
export function generateTempPassword() {
  for (;;) {
    const groups = Array.from({ length: 3 }, () => Array.from({ length: 4 }, () => pick(ALL)).join(""));
    const random = groups.join("");
    // The prefix already brings upper, lower and a symbol; make the random part carry them too.
    if (/[a-z]/.test(random) && /[A-Z]/.test(random) && /\d/.test(random)) return `${TEMP_PASSWORD_PREFIX}${groups.join("-")}`;
  }
}

/** Whether a password looks like one we issued, so it can't be kept as someone's own. */
export function looksLikeTempPassword(password: string) {
  return password.toLowerCase().startsWith(TEMP_PASSWORD_PREFIX.toLowerCase());
}

export function tempPasswordExpiry(from = new Date()) {
  return new Date(from.getTime() + TEMP_PASSWORD_DAYS * 24 * 60 * 60 * 1000);
}
