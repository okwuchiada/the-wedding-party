"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export type SubmitContributionState = { error?: string; success?: boolean } | undefined;

export async function submitContribution(
  _prevState: SubmitContributionState,
  formData: FormData
): Promise<SubmitContributionState> {
  const registryItemId = formData.get("registryItemId");
  const guestName = formData.get("guestName");
  const amountCents = formData.get("amountCents");
  const note = formData.get("note");

  if (typeof registryItemId !== "string" || registryItemId.length === 0) {
    return { error: "Missing item" };
  }
  if (typeof guestName !== "string" || guestName.trim().length === 0) {
    return { error: "Please enter your name" };
  }
  const amount = Number(amountCents);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid amount" };
  }

  await prisma.contribution.create({
    data: {
      registryItemId,
      guestName: guestName.trim(),
      amountCents: Math.round(amount),
      note: typeof note === "string" && note.trim() ? note.trim() : null,
      status: "AWAITING_CONFIRMATION",
    },
  });

  revalidatePath("/admin");

  return { success: true };
}

export async function confirmContribution(contributionId: string) {
  await verifySession();

  await prisma.contribution.update({
    where: { id: contributionId },
    data: { status: "CONFIRMED", confirmedAt: new Date() },
  });

  revalidatePath("/admin");
  revalidatePath("/");
}
