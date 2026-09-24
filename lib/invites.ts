import "server-only";
import { inviteEmail, sendMail } from "@/lib/mail";
import { createUserToken } from "@/lib/tokens";

/**
 * Emails a link that lets the user set their password. Used when a couple adds
 * a partner, and by scripts/invite-user.ts for migrated accounts.
 */
export async function sendInvite(user: { id: string; email: string }, weddingName: string | null) {
  const token = await createUserToken(user.id, "INVITE");
  await sendMail({ to: user.email, ...inviteEmail({ token, weddingName }) });
  return token;
}
