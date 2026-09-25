"use server";

import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { forgetPartnerName } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { takeRateLimit } from "@/lib/rate-limit";
import { slugError } from "@/lib/slug";
import { THEME_PRESETS } from "@/lib/themes";
import { dashboardPath } from "@/lib/tenant";

export type CreateWeddingState = { error?: string } | undefined;

const DAY = 24 * 60 * 60 * 1000;

export async function createWedding(
  _prevState: CreateWeddingState,
  formData: FormData
): Promise<CreateWeddingState> {
  const user = await verifySession();

  const brideName = formData.get("brideName");
  const groomName = formData.get("groomName");
  const weddingDate = formData.get("weddingDate");
  const slug = typeof formData.get("slug") === "string" ? (formData.get("slug") as string).trim() : "";

  if (typeof brideName !== "string" || !brideName.trim()) return { error: "Enter the first partner's name" };
  if (typeof groomName !== "string" || !groomName.trim()) return { error: "Enter the second partner's name" };
  if (typeof weddingDate !== "string" || !weddingDate) return { error: "Choose your wedding date" };
  // Stored as literal UTC, like saveStory, so it displays exactly as entered.
  const date = new Date(`${weddingDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return { error: "Choose a valid wedding date" };

  const presetKey = formData.get("presetKey");
  if (!THEME_PRESETS.some((p) => p.key === presetKey)) return { error: "Choose a look for your site" };

  const invalidSlug = slugError(slug);
  if (invalidSlug) return { error: `Web address: ${invalidSlug}` };

  if (!(await takeRateLimit("wedding:create", user.id, 5, DAY))) {
    return { error: "You've created several weddings today. Please try again tomorrow." };
  }
  if (await prisma.wedding.findUnique({ where: { slug }, select: { id: true } })) {
    return { error: "That web address is taken. Try another." };
  }

  const wedding = await prisma.wedding.create({
    data: {
      slug,
      status: "DRAFT",
      members: { create: { userId: user.id, role: "OWNER" } },
      theme: { create: { presetKey: presetKey as string } },
      story: {
        create: { brideName: brideName.trim(), groomName: groomName.trim(), weddingDate: date },
      },
    },
  });

  await forgetPartnerName();
  redirect(dashboardPath(wedding.id));
}


/** Live check for the create form; the create action re-checks on submit. */
export async function checkSlugAvailable(slug: string): Promise<{ available: boolean; reason?: string }> {
  await verifySession();
  const invalid = typeof slug === "string" ? slugError(slug) : "Invalid";
  if (invalid) return { available: false, reason: invalid };
  const taken = await prisma.wedding.findUnique({ where: { slug }, select: { id: true } });
  return taken ? { available: false, reason: "Already taken" } : { available: true };
}
