import "server-only";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { generateTempPassword, tempPasswordExpiry } from "@/lib/temp-password";

/**
 * Gives a user a new temporary password they must change on their next sign-in.
 * Signs out their other sessions. Returns the plain password once, to email.
 */
export async function issueTempPassword(userId: string) {
  const tempPassword = generateTempPassword();
  const expiresAt = tempPasswordExpiry();
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(tempPassword),
      mustChangePassword: true,
      tempPasswordExpiresAt: expiresAt,
      sessionVersion: { increment: 1 },
    },
  });
  return { tempPassword, expiresAt };
}
