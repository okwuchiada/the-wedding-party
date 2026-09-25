import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { decryptSessionToken, signSessionToken, type SessionPayload } from "@/lib/session-token";

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const IMPERSONATION_DURATION_MS = 60 * 60 * 1000;

export type { SessionPayload };

export async function decrypt(session: string | undefined = ""): Promise<SessionPayload | null> {
  return decryptSessionToken(session);
}

export async function createSession(user: { id: string; sessionVersion: number }, impersonatorId?: string) {
  // Impersonation is short-lived; the admin signs back in as themselves afterwards.
  const absoluteExpiresAt = new Date(Date.now() + (impersonatorId ? IMPERSONATION_DURATION_MS : SESSION_DURATION_MS));
  const { token, exp } = await signSessionToken({
    userId: user.id,
    sv: user.sessionVersion,
    ...(impersonatorId ? { impersonatorId } : {}),
    expiresAt: absoluteExpiresAt.toISOString(),
  });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: exp,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}
