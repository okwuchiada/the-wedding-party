// Pure JWT signing/verification, with no `next/headers` dependency, so it can
// also be imported from proxy.ts (which cannot use the server-only cookie APIs).
import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

/** A session with no activity for this long is treated as logged out. */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export type SessionPayload = {
  userId: string;
  /** User.sessionVersion at sign-in; a password change invalidates older sessions. */
  sv: number;
  /** Set while a super admin is impersonating userId. */
  impersonatorId?: string;
  /** Absolute cap on the session; sliding refreshes never extend past it. */
  expiresAt: string;
};

/** The token's real expiry: whichever comes first, the idle timeout or the absolute cap. */
function slidingExpiry(absoluteExpiresAt: Date) {
  return new Date(Math.min(Date.now() + IDLE_TIMEOUT_MS, absoluteExpiresAt.getTime()));
}

/** Signs `payload`, refreshing the idle window. Returns the token and its actual expiry. */
export async function signSessionToken(payload: SessionPayload) {
  const exp = slidingExpiry(new Date(payload.expiresAt));
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(encodedKey);
  return { token, exp };
}

export async function decryptSessionToken(token: string | undefined = ""): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string" || typeof payload.sv !== "number" || typeof payload.expiresAt !== "string") {
      return null;
    }
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
