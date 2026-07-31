"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendMail, rsvpConfirmationEmail } from "@/lib/mail";

export type SubmitRsvpState =
  | { error?: string; success?: boolean; guestName?: string; attending?: boolean }
  | undefined;

const MAX_TOTAL_GUESTS = 100;

export async function submitRsvp(
  _prevState: SubmitRsvpState,
  formData: FormData
): Promise<SubmitRsvpState> {
  const guestName = formData.get("guestName");
  const email = formData.get("email");
  const attendingRaw = formData.get("attending");
  const message = formData.get("message");

  if (typeof guestName !== "string" || !guestName.trim()) {
    return { error: "Please enter your name" };
  }
  if (typeof email !== "string" || !email.trim().includes("@")) {
    return { error: "Please enter a valid email" };
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

  const trimmedEmail = email.trim();

  await prisma.rsvp.create({
    data: {
      guestName: guestName.trim(),
      email: trimmedEmail,
      attending,
      guestCount: 1,
      message: typeof message === "string" && message.trim() ? message.trim() : null,
    },
  });

  revalidatePath("/admin");

  const story = await prisma.storyContent.findUnique({ where: { id: "main" } });
  if (story) {
    await sendMail({
      to: trimmedEmail,
      ...rsvpConfirmationEmail({
        guestName: guestName.trim(),
        attending,
        brideName: story.brideName,
        groomName: story.groomName,
        weddingDate: story.weddingDate,
        location: story.location,
        venueAddress: story.venueAddress,
        bridePhone: story.bridePhone,
      }),
    });
  }

  return { success: true, guestName: guestName.trim(), attending };
}
