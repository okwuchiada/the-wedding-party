"use server";

import { requireWeddingAccess } from "@/lib/dal";
import { takeGuestRateLimit } from "@/lib/rate-limit";
import { resolveGuestAction, revalidateDashboard, revalidateWedding } from "@/lib/tenant";

// Per guest IP per wedding and hour.
const WISHES_PER_HOUR = 20;

export type SubmitWishState =
  | { error?: string; success?: boolean; guestName?: string; message?: string }
  | undefined;

export async function submitWish(
  slug: string,
  _prevState: SubmitWishState,
  formData: FormData
): Promise<SubmitWishState> {
  const guest = await resolveGuestAction(slug);
  if (!guest) return { error: "This wedding isn't accepting wishes." };
  const { wedding, db } = guest;

  const guestName = formData.get("guestName");
  const message = formData.get("message");

  if (typeof guestName !== "string" || !guestName.trim()) {
    return { error: "Please enter your name" };
  }
  if (typeof message !== "string" || !message.trim()) {
    return { error: "Please write a short message" };
  }
  if (message.trim().length > 500) {
    return { error: "Message is too long" };
  }
  if (!(await takeGuestRateLimit("wish", wedding.id, WISHES_PER_HOUR, 60 * 60 * 1000))) {
    return { error: "Too many wishes sent at once. Please try again in a little while." };
  }

  await db.wish.create({
    data: {
      weddingId: wedding.id,
      guestName: guestName.trim(),
      message: message.trim(),
      status: "PENDING",
    },
  });

  revalidateDashboard(wedding);

  return { success: true, guestName: guestName.trim(), message: message.trim() };
}

export async function approveWish(weddingId: string, id: string) {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "approveWish");
  await db.wish.update({ where: { id, weddingId: wedding.id }, data: { status: "APPROVED" } });
  revalidateWedding(wedding);
}

export async function hideWish(weddingId: string, id: string) {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "hideWish");
  await db.wish.update({ where: { id, weddingId: wedding.id }, data: { status: "HIDDEN" } });
  revalidateWedding(wedding);
}
