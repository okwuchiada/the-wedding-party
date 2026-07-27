"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type SubmitRsvpState =
  | { error?: string; success?: boolean; guestName?: string; attending?: boolean }
  | undefined;

const MAX_GUESTS = 10;

export async function submitRsvp(
  _prevState: SubmitRsvpState,
  formData: FormData
): Promise<SubmitRsvpState> {
  const guestName = formData.get("guestName");
  const attendingRaw = formData.get("attending");
  const guestCountRaw = formData.get("guestCount");
  const message = formData.get("message");

  if (typeof guestName !== "string" || !guestName.trim()) {
    return { error: "Please enter your name" };
  }
  if (attendingRaw !== "yes" && attendingRaw !== "no") {
    return { error: "Please let us know if you can make it" };
  }

  const attending = attendingRaw === "yes";
  const guestCountNum = Number(guestCountRaw);
  const guestCount = attending
    ? Math.min(MAX_GUESTS, Math.max(1, Number.isFinite(guestCountNum) ? Math.round(guestCountNum) : 1))
    : 1;

  await prisma.rsvp.create({
    data: {
      guestName: guestName.trim(),
      attending,
      guestCount,
      message: typeof message === "string" && message.trim() ? message.trim() : null,
    },
  });

  revalidatePath("/admin");

  return { success: true, guestName: guestName.trim(), attending };
}
