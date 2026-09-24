import "server-only";
import { hash, verify } from "@node-rs/argon2";

export const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;

export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) return "That password is too long";
  return null;
}

export function hashPassword(password: string) {
  return hash(password);
}

// Verified against when the account doesn't exist, so a missing email takes as
// long to reject as a wrong password.
let dummyHash: Promise<string> | null = null;

export async function verifyPassword(passwordHash: string | null | undefined, password: string) {
  if (!passwordHash) {
    dummyHash ??= hash("not-a-real-password");
    await verify(await dummyHash, password).catch(() => false);
    return false;
  }
  return verify(passwordHash, password).catch(() => false);
}
