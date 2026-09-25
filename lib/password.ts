import "server-only";
import { hash, verify } from "@node-rs/argon2";

// New-password rules live in lib/password-rules.ts so the forms can show them live.
export { MIN_PASSWORD_LENGTH, validatePassword } from "@/lib/password-rules";

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
