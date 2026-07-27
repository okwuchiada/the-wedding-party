"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export type SubmitWishState =
  | { error?: string; success?: boolean; guestName?: string; message?: string }
  | undefined;

export async function submitWish(
  _prevState: SubmitWishState,
  formData: FormData
): Promise<SubmitWishState> {
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

  await prisma.wish.create({
    data: {
      guestName: guestName.trim(),
      message: message.trim(),
      status: "PENDING",
    },
  });

  revalidatePath("/admin");

  return { success: true, guestName: guestName.trim(), message: message.trim() };
}

export async function approveWish(id: string) {
  await verifySession();
  await prisma.wish.update({ where: { id }, data: { status: "APPROVED" } });
  revalidatePath("/admin");
  revalidatePath("/wishes");
}

export async function hideWish(id: string) {
  await verifySession();
  await prisma.wish.update({ where: { id }, data: { status: "HIDDEN" } });
  revalidatePath("/admin");
  revalidatePath("/wishes");
}
