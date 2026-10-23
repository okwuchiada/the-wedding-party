"use server";

import { revalidatePath } from "next/cache";
import type { SuperActionResult } from "@/lib/actions/super";
import { audit } from "@/lib/audit";
import { requirePermission, verifySession } from "@/lib/dal";
import { sendMail, supportReplyEmail, supportRequestStaffEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { takeRateLimit } from "@/lib/rate-limit";
import { isSupportStatus, readMessage, readNewRequest, SUPPORT_STATUS_LABELS, topicLabel } from "@/lib/support";

export type SupportFormState = { error?: string; success?: boolean } | undefined;

const HOUR = 60 * 60 * 1000;

function revalidateSupport(requestId?: string) {
  revalidatePath("/dashboard/support");
  revalidatePath("/super/requests");
  if (requestId) revalidatePath(`/super/requests/${requestId}`);
}

/** Couples only: staff "viewing as" a couple shouldn't speak for them. */
async function requireCouple() {
  const user = await verifySession();
  if (user.impersonatorId) return { error: "You're viewing as this couple. Requests can only be sent by the couple themselves." } as const;
  return { user } as const;
}

// ─── Couples (Dashboard → Support) ───────────────────────────────────────────

export async function createSupportRequest(_prev: SupportFormState, formData: FormData): Promise<SupportFormState> {
  const session = await requireCouple();
  if ("error" in session) return { error: session.error };
  const { user } = session;

  const fields = readNewRequest({ topic: formData.get("topic"), subject: formData.get("subject"), body: formData.get("body") });
  if ("error" in fields) return { error: fields.error };

  // Only a wedding they belong to; anything else is quietly dropped.
  const weddingParam = String(formData.get("weddingId") ?? "");
  const membership = weddingParam
    ? await prisma.weddingMember.findUnique({ where: { weddingId_userId: { weddingId: weddingParam, userId: user.id } } })
    : null;

  if (!(await takeRateLimit("support:create", user.id, 5, HOUR))) {
    return { error: "You've sent several requests in the last hour. We'll get to them; add anything new as a reply." };
  }

  const request = await prisma.supportRequest.create({
    data: {
      requesterId: user.id,
      weddingId: membership?.weddingId ?? null,
      topic: fields.topic,
      subject: fields.subject,
      messages: { create: { authorId: user.id, body: fields.body } },
    },
  });

  if (process.env.SUPPORT_EMAIL) {
    await sendMail({
      to: process.env.SUPPORT_EMAIL,
      ...supportRequestStaffEmail({ requestId: request.id, subject: fields.subject, from: user.email, topic: topicLabel(fields.topic) }),
    });
  }
  revalidateSupport(request.id);
  return { success: true };
}

export async function replyToSupportRequest(requestId: string, _prev: SupportFormState, formData: FormData): Promise<SupportFormState> {
  const session = await requireCouple();
  if ("error" in session) return { error: session.error };
  const { user } = session;

  const message = readMessage(formData.get("body"));
  if ("error" in message) return { error: message.error };
  const request = await prisma.supportRequest.findFirst({ where: { id: requestId, requesterId: user.id } });
  if (!request) return { error: "Request not found" };
  if (!(await takeRateLimit("support:reply", user.id, 20, HOUR))) return { error: "Too many messages. Try again in a little while." };

  await prisma.supportRequest.update({
    where: { id: request.id },
    data: {
      messages: { create: { authorId: user.id, body: message.body } },
      // Writing again on a resolved request opens it back up.
      ...(request.status === "RESOLVED" ? { status: "OPEN", resolvedAt: null } : {}),
    },
  });
  revalidateSupport(request.id);
  return { success: true };
}

// ─── Staff (Staff console → Requests) ────────────────────────────────────────

export async function replyAsStaff(requestId: string, _prev: SupportFormState, formData: FormData): Promise<SupportFormState> {
  const staff = await requirePermission("support.respond");
  const message = readMessage(formData.get("body"));
  if ("error" in message) return { error: message.error };
  const request = await prisma.supportRequest.findUnique({ where: { id: requestId }, include: { requester: { select: { email: true } } } });
  if (!request) return { error: "Request not found" };

  const resolve = formData.get("resolve") === "on";
  await prisma.supportRequest.update({
    where: { id: request.id },
    data: {
      messages: { create: { authorId: staff.id, fromStaff: true, body: message.body } },
      status: resolve ? "RESOLVED" : "IN_PROGRESS",
      resolvedAt: resolve ? new Date() : null,
      // Whoever answers first takes it on.
      assigneeId: request.assigneeId ?? staff.id,
    },
  });
  await audit(staff.id, "support.reply", { weddingId: request.weddingId ?? undefined, meta: { requestId: request.id, resolved: resolve } });
  await sendMail({ to: request.requester.email, ...supportReplyEmail({ subject: request.subject }) });
  revalidateSupport(request.id);
  return { success: true };
}

export async function setSupportRequestStatus(requestId: string, status: string): Promise<SuperActionResult> {
  const staff = await requirePermission("support.respond");
  if (!isSupportStatus(status)) return { error: "Unknown status" };
  const request = await prisma.supportRequest.findUnique({ where: { id: requestId } });
  if (!request) return { error: "Request not found" };
  if (request.status === status) return { message: `Already ${SUPPORT_STATUS_LABELS[status].toLowerCase()}` };

  await prisma.supportRequest.update({
    where: { id: request.id },
    data: { status, resolvedAt: status === "RESOLVED" ? new Date() : null },
  });
  await audit(staff.id, "support.status", { weddingId: request.weddingId ?? undefined, meta: { requestId: request.id, from: request.status, to: status } });
  revalidateSupport(request.id);
  return { message: `Marked ${SUPPORT_STATUS_LABELS[status].toLowerCase()}` };
}

export async function assignSupportRequestToMe(requestId: string): Promise<SuperActionResult> {
  const staff = await requirePermission("support.respond");
  const request = await prisma.supportRequest.findUnique({ where: { id: requestId } });
  if (!request) return { error: "Request not found" };
  if (request.assigneeId === staff.id) return { message: "It's already yours" };

  await prisma.supportRequest.update({
    where: { id: request.id },
    data: { assigneeId: staff.id, ...(request.status === "OPEN" ? { status: "IN_PROGRESS" } : {}) },
  });
  await audit(staff.id, "support.assign", { weddingId: request.weddingId ?? undefined, meta: { requestId: request.id } });
  revalidateSupport(request.id);
  return { message: "Assigned to you" };
}
