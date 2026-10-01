"use server";

import { revalidatePath } from "next/cache";
import { getCountries } from "@/lib/countries";
import { requireWeddingAccess } from "@/lib/dal";
import { CURRENCIES, LOCALES } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { planAllowsTheme, siteClosesAt } from "@/lib/plans";
import { slugError, slugFromInput } from "@/lib/slug";
import { getStarterPlan } from "@/lib/starter-plan";
import { getPreset } from "@/lib/themes";
import { guestPath, revalidateWedding } from "@/lib/tenant";
import { parsePartySizeLimit } from "@/lib/rsvp-rules";

export type SettingsFormState = { error?: string; success?: boolean } | undefined;

/** Hard ceiling for weddings without a plan yet. */
const DEFAULT_GUEST_LIMIT = 10_000;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveSettings(
  weddingId: string,
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const { wedding } = await requireWeddingAccess(weddingId, "owner", "saveSettings");

  // A pasted full link keeps just its address part (see slugFromInput).
  const slug = slugFromInput(text(formData, "slug")).slug;
  const invalidSlug = slugError(slug);
  if (invalidSlug) return { error: `Web address: ${invalidSlug}` };
  if (slug !== wedding.slug && (await prisma.wedding.findUnique({ where: { slug }, select: { id: true } }))) {
    return { error: "That web address is taken" };
  }

  const currency = text(formData, "currency");
  const locale = text(formData, "locale");
  if (!(CURRENCIES as readonly string[]).includes(currency)) return { error: "Choose a currency" };
  if (!(LOCALES as readonly string[]).includes(locale)) return { error: "Choose a number format" };

  const phoneCountryCode = text(formData, "phoneCountryCode").replace(/^\+/, "");
  if (!/^\d{1,4}$/.test(phoneCountryCode)) return { error: "Phone country code should be 1–4 digits, e.g. 234" };

  const limit = wedding.plan?.maxGuests ?? DEFAULT_GUEST_LIMIT;
  const maxGuests = Number(text(formData, "maxGuests"));
  if (!Number.isInteger(maxGuests) || maxGuests < 1) return { error: "Guest limit must be a whole number" };
  if (maxGuests > limit) return { error: `Your plan allows up to ${limit} guests` };

  const partySize = parsePartySizeLimit(formData.get("maxPartySize"));
  if ("error" in partySize) return { error: partySize.error };

  const allowedCountries = [
    ...new Set(
      text(formData, "allowedCountries")
        .toUpperCase()
        .split(/[\s,]+/)
        .filter(Boolean)
    ),
  ];
  // Only codes from the Country table, so a typo can't lock every guest out.
  const known = new Set((await getCountries()).map((c) => c.code));
  if (allowedCountries.some((code) => !known.has(code))) {
    return { error: "Choose countries from the list" };
  }
  const geoBypassToken = text(formData, "geoBypassToken");
  if (geoBypassToken && (geoBypassToken.length < 4 || geoBypassToken.length > 100)) {
    return { error: "Access code should be 4–100 characters" };
  }

  await prisma.wedding.update({
    where: { id: wedding.id },
    data: {
      slug,
      currency,
      locale,
      phoneCountryCode,
      maxGuests,
      maxPartySize: partySize.value,
      allowedCountries,
      geoBypassToken: geoBypassToken || null,
    },
  });

  if (slug !== wedding.slug) revalidatePath(guestPath(wedding.slug), "layout");
  revalidateWedding({ id: wedding.id, slug });
  return { success: true };
}

export async function setPublished(weddingId: string, publish: boolean): Promise<{ error?: string }> {
  const { wedding } = await requireWeddingAccess(weddingId, "owner", "setPublished");

  if (wedding.status === "SUSPENDED" || wedding.status === "ARCHIVED") {
    return { error: "This wedding has been suspended. Contact support." };
  }
  // Weddings from before the free plan existed join it when they first publish.
  let plan = wedding.plan;
  if (publish && !plan) {
    plan = await getStarterPlan();
    if (plan) await prisma.wedding.update({ where: { id: wedding.id }, data: { planId: plan.id } });
  }

  if (publish) {
    const onFreePlan = plan?.priceKobo === 0;
    if (!wedding.paidAt && !wedding.comped && !onFreePlan) return { error: "Choose a plan to publish your site" };

    const [theme, story] = await Promise.all([
      prisma.weddingTheme.findUnique({ where: { weddingId: wedding.id }, select: { presetKey: true } }),
      prisma.storyContent.findUnique({ where: { weddingId: wedding.id }, select: { weddingDate: true } }),
    ]);
    if (theme && !planAllowsTheme(plan, theme.presetKey)) {
      return {
        error: `${getPreset(theme.presetKey).name} isn't included in ${plan!.name}. Pick one of your plan's themes in Design, or upgrade to keep it.`,
      };
    }
    const closes = siteClosesAt(plan, story?.weddingDate);
    if (closes && closes <= new Date()) {
      return { error: `Your ${plan!.name} site closed on ${closes.toLocaleDateString("en-GB", { dateStyle: "long", timeZone: "UTC" })}. Upgrade to publish it again.` };
    }
  }

  await prisma.wedding.update({
    where: { id: wedding.id },
    data: { status: publish === true ? "ACTIVE" : "DRAFT" },
  });

  revalidateWedding(wedding);
  return {};
}
