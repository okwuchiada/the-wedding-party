"use server";

import { requireWeddingAccess } from "@/lib/dal";
import { moneyFormat, resolveGuestAction, revalidateDashboard, revalidateWedding, weddingTheme } from "@/lib/tenant";
import { contributionNotificationEmail, emailPalette, sendMail } from "@/lib/mail";

export type SubmitContributionState = { error?: string; success?: boolean } | undefined;

export async function submitContribution(
  slug: string,
  _prevState: SubmitContributionState,
  formData: FormData
): Promise<SubmitContributionState> {
  const guest = await resolveGuestAction(slug);
  if (!guest) return { error: "This registry isn't available." };
  const { wedding, db } = guest;

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

  const item = await db.registryItem.findUnique({
    where: { id: registryItemId, weddingId: wedding.id },
    select: { id: true },
  });
  if (!item) return { error: "That item is no longer on the registry" };

  const contribution = await db.contribution.create({
    data: {
      weddingId: wedding.id,
      registryItemId: item.id,
      guestName: guestName.trim(),
      amountCents: Math.round(amount),
      note: typeof note === "string" && note.trim() ? note.trim() : null,
      status: "AWAITING_CONFIRMATION",
    },
    include: { registryItem: true },
  });

  revalidateDashboard(wedding);

  const story = await db.storyContent.findUnique({ where: { weddingId: wedding.id } });
  if (story?.contactEmail) {
    await sendMail({
      to: story.contactEmail,
      ...contributionNotificationEmail({
        weddingId: wedding.id,
        guestName: contribution.guestName,
        itemName: contribution.registryItem.name,
        amountCents: contribution.amountCents,
        note: contribution.note,
        money: moneyFormat(wedding),
        palette: emailPalette(weddingTheme(wedding).colors),
      }),
    });
  } else {
    console.warn("[mail] Skipped contribution notification — no contactEmail configured");
  }

  return { success: true };
}

export async function confirmContribution(weddingId: string, contributionId: string) {
  const { wedding, db } = await requireWeddingAccess(weddingId);

  await db.contribution.update({
    where: { id: contributionId, weddingId: wedding.id },
    data: { status: "CONFIRMED", confirmedAt: new Date() },
  });

  revalidateWedding(wedding);
}
