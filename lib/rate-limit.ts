import "server-only";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/request";

const PRUNE_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Records an attempt and reports whether it is within `limit` attempts per
 * `windowMs` for this kind and key. Attempts are stored in the database so
 * limits hold across serverless instances.
 */
export async function takeRateLimit(kind: string, key: string | null, limit: number, windowMs: number) {
  if (!key) return true;
  const since = new Date(Date.now() - windowMs);
  const recent = await prisma.authAttempt.count({ where: { kind, key, createdAt: { gte: since } } });
  if (recent >= limit) return false;

  await prisma.authAttempt.create({ data: { kind, key } });
  if (Math.random() < 0.01) {
    await prisma.authAttempt.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - PRUNE_AFTER_MS) } },
    });
  }
  return true;
}

/**
 * Per-guest limit on a public form: counted per IP within one wedding, so a busy
 * wedding can't use up another's allowance. Guests at a venue often share one IP
 * (the venue Wi-Fi), so keep limits generous.
 */
export async function takeGuestRateLimit(kind: string, weddingId: string, limit: number, windowMs: number) {
  const ip = await getClientIp();
  return takeRateLimit(`guest:${kind}`, ip ? `${weddingId}:${ip}` : null, limit, windowMs);
}
