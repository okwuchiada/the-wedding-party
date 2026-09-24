import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { TokenPurpose } from "@/lib/generated/prisma/client";

const TTL_MS: Record<TokenPurpose, number> = {
  RESET: 60 * 60 * 1000, // 1 hour
  INVITE: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Creates a single-use token; only its hash is stored. Returns the raw token for the emailed link. */
export async function createUserToken(userId: string, purpose: TokenPurpose) {
  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: {
      userId,
      purpose,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TTL_MS[purpose]),
    },
  });
  return token;
}

/** A token that exists, is unused and hasn't expired, with its user. */
export async function findValidToken(token: unknown) {
  if (typeof token !== "string" || !token) return null;
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;
  return record;
}

export function hashUserToken(token: string) {
  return hashToken(token);
}
