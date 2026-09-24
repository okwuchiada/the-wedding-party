"use server";

import { revalidatePath } from "next/cache";
import { requireWeddingAccess } from "@/lib/dal";
import { CURRENCIES, LOCALES } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { slugError } from "@/lib/slug";
import { guestPath, revalidateWedding } from "@/lib/tenant";

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
  const { wedding } = await requireWeddingAccess(weddingId, "OWNER");

  const slug = text(formData, "slug").toLowerCase();
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

  const allowedCountries = [
    ...new Set(
      text(formData, "allowedCountries")
        .toUpperCase()
        .split(/[\s,]+/)
        .filter(Boolean)
    ),
  ];
  if (allowedCountries.some((code) => !/^[A-Z]{2}$/.test(code))) {
    return { error: "Countries should be two-letter codes like NG, GH, GB" };
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
      allowedCountries,
      geoBypassToken: geoBypassToken || null,
    },
  });

  if (slug !== wedding.slug) revalidatePath(guestPath(wedding.slug), "layout");
  revalidateWedding({ id: wedding.id, slug });
  return { success: true };
}

export async function setPublished(weddingId: string, publish: boolean): Promise<{ error?: string }> {
  const { wedding } = await requireWeddingAccess(weddingId, "OWNER");

  if (wedding.status === "SUSPENDED" || wedding.status === "ARCHIVED") {
    return { error: "This wedding has been suspended. Contact support." };
  }
  if (publish && !wedding.paidAt && !wedding.comped) {
    return { error: "Choose a plan to publish your site" };
  }

  await prisma.wedding.update({
    where: { id: wedding.id },
    data: { status: publish === true ? "ACTIVE" : "DRAFT" },
  });

  revalidateWedding(wedding);
  return {};
}
