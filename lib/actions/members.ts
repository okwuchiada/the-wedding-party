"use server";

import { requireWeddingAccess } from "@/lib/dal";
import { sendInvite } from "@/lib/invites";
import { prisma } from "@/lib/prisma";
import { takeRateLimit } from "@/lib/rate-limit";
import { coupleTitle } from "@/lib/layouts";
import { getNameStyle, revalidateDashboard } from "@/lib/tenant";

export type InviteMemberState = { error?: string; message?: string } | undefined;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY = 24 * 60 * 60 * 1000;

/** Owners add a partner or planner. New people get an email to set their password. */
export async function inviteMember(
  weddingId: string,
  _prevState: InviteMemberState,
  formData: FormData
): Promise<InviteMemberState> {
  const { wedding } = await requireWeddingAccess(weddingId, "owner", "inviteMember");

  const email = typeof formData.get("email") === "string" ? (formData.get("email") as string).trim().toLowerCase() : "";
  const role = formData.get("role") === "OWNER" ? "OWNER" : "EDITOR";
  if (!EMAIL_REGEX.test(email)) return { error: "Enter a valid email" };

  if (!(await takeRateLimit("member:invite", wedding.id, 20, DAY))) {
    return { error: "Too many invites today. Please try again tomorrow." };
  }

  const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email } });
  const existing = await prisma.weddingMember.findUnique({
    where: { weddingId_userId: { weddingId: wedding.id, userId: user.id } },
  });
  if (existing) return { error: "They already have access to this wedding" };

  await prisma.weddingMember.create({ data: { weddingId: wedding.id, userId: user.id, role } });

  let message = `${email} can now manage this wedding.`;
  if (!user.passwordHash) {
    const story = await prisma.storyContent.findUnique({ where: { weddingId: wedding.id } });
    await sendInvite(user, coupleTitle(story, await getNameStyle(wedding.id)));
    message = `Invite sent to ${email}.`;
  }

  revalidateDashboard(wedding);
  return { message };
}

export async function removeMember(weddingId: string, memberId: string): Promise<{ error?: string }> {
  const { wedding } = await requireWeddingAccess(weddingId, "owner", "removeMember");

  const member = await prisma.weddingMember.findUnique({ where: { id: memberId } });
  if (!member || member.weddingId !== wedding.id) return { error: "Member not found" };

  if (member.role === "OWNER") {
    const owners = await prisma.weddingMember.count({ where: { weddingId: wedding.id, role: "OWNER" } });
    if (owners <= 1) return { error: "A wedding needs at least one owner" };
  }

  await prisma.weddingMember.delete({ where: { id: member.id } });
  revalidateDashboard(wedding);
  return {};
}
