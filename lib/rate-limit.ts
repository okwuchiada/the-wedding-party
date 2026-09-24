import "server-only";
import { prisma } from "@/lib/prisma";

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
