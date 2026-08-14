"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { sendMail, rsvpConfirmationEmail } from "@/lib/mail";

export type SubmitRsvpState =
  | { error?: string; success?: boolean; guestName?: string; attending?: boolean }
  | undefined;

const MAX_TOTAL_GUESTS = 100;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const BURST_WINDOW_MS = 30 * 1000;

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || null;
  return h.get("x-real-ip");
}

export async function submitRsvp(
  _prevState: SubmitRsvpState,
  formData: FormData
): Promise<SubmitRsvpState> {
  const honeypot = formData.get("website");
  const guestName = formData.get("guestName");
  const attendingRaw = formData.get("attending");

  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return {
      success: true,
      guestName: typeof guestName === "string" && guestName.trim() ? guestName.trim() : "Guest",
      attending: attendingRaw === "yes",
    };
  }

  const ip = await getClientIp();
  const userAgent = (await headers()).get("user-agent");

  if (ip) {
    const recent = await prisma.rsvp.findMany({
      where: { ipAddress: ip, createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) } },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    if (recent.length >= RATE_LIMIT_MAX) {
      return { error: "Too many RSVP attempts from your network. Please try again later." };
    }
    if (recent[0] && Date.now() - recent[0].createdAt.getTime() < BURST_WINDOW_MS) {
      return { error: "Please wait a moment before submitting again." };
    }
  }

  const email = formData.get("email");
  const message = formData.get("message");

  if (typeof guestName !== "string" || !guestName.trim()) {
    return { error: "Please enter your name" };
  }
  if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
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
      ipAddress: ip,
      userAgent,
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

export async function deleteRsvp(id: string): Promise<{ error?: string }> {
  await verifySession();
  await prisma.rsvp.delete({ where: { id } });
  revalidatePath("/admin");
  return {};
}
