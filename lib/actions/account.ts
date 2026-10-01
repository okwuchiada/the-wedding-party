"use server";

import { revalidatePath } from "next/cache";
import { parseAccountProfile } from "@/lib/account-profile";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export type AccountState = { error?: string; message?: string } | undefined;

/**
 * Updates the signed-in person's own name and phone. The sign-in email is never
 * read from the form, so it can't be changed here.
 */
export async function saveAccountProfile(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const me = await verifySession();
  // "View as" is for looking; a staff member shouldn't edit a couple's own account.
  if (me.impersonatorId) return { error: "You're viewing as this couple, so their account can't be changed here." };

  const parsed = parseAccountProfile((name) => formData.get(name));
  if (!parsed.data) return { error: parsed.error };

  const current = await prisma.user.findUniqueOrThrow({ where: { id: me.id }, select: { name: true, phone: true } });
  if (current.name === parsed.data.name && current.phone === parsed.data.phone) return { message: "No changes to save." };

  await prisma.user.update({ where: { id: me.id }, data: parsed.data });
  revalidatePath("/dashboard", "layout");
  return { message: "Saved." };
}
