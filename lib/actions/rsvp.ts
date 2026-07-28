"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type SubmitRsvpState =
  | { error?: string; success?: boolean; guestName?: string; attending?: boolean }
  | undefined;

const MAX_TOTAL_GUESTS = 100;

export async function submitRsvp(
  _prevState: SubmitRsvpState,
  formData: FormData
): Promise<SubmitRsvpState> {
  const guestName = formData.get("guestName");
  const attendingRaw = formData.get("attending");
  const message = formData.get("message");

  if (typeof guestName !== "string" || !guestName.trim()) {
    return { error: "Please enter your name" };
  }
  if (attendingRaw !== "yes" && attendingRaw !== "no") {
    return { error: "Please let us know if you can make it" };
  }

  const attending = attendingRaw === "yes";

  if (attending) {
    const { _sum } = await prisma.rsvp.aggregate({
      where: { attending: true },
      _sum: { guestCount: true },
    });
    const currentTotal = _sum.guestCount ?? 0;
    if (currentTotal + 1 > MAX_TOTAL_GUESTS) {
      return { error: "Sorry, we've reached full capacity and can no longer accept RSVPs." };
    }
  }

  await prisma.rsvp.create({
    data: {
      guestName: guestName.trim(),
      attending,
      guestCount: 1,
      message: typeof message === "string" && message.trim() ? message.trim() : null,
    },
  });

  revalidatePath("/admin");

  return { success: true, guestName: guestName.trim(), attending };
}
