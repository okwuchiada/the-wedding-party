"use server";

import { requireWeddingAccess } from "@/lib/dal";
import { COPY_FIELDS, COPY_MAX_LENGTH } from "@/lib/copy";
import { FONT_OPTIONS, isFontKey, type FontRole } from "@/lib/font-options";
import { prisma } from "@/lib/prisma";
import { revalidateWedding } from "@/lib/tenant";
import { COLOR_FIELDS, getPreset, isHexColor, THEME_PRESETS } from "@/lib/themes";

export type DesignFormState = { error?: string; success?: boolean } | undefined;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Saves the preset plus only the colors/fonts that differ from it. */
export async function saveTheme(
  weddingId: string,
  _prevState: DesignFormState,
  formData: FormData
): Promise<DesignFormState> {
  const { wedding } = await requireWeddingAccess(weddingId);

  const presetKey = text(formData, "presetKey");
  if (!THEME_PRESETS.some((p) => p.key === presetKey)) return { error: "Choose a theme" };
  const preset = getPreset(presetKey);

  const colors: Record<string, string> = {};
  for (const { key, label } of COLOR_FIELDS) {
    const value = text(formData, `color_${key}`).toLowerCase();
    if (!value) continue;
    if (!isHexColor(value)) return { error: `${label} must be a color like #c1440e` };
    if (value !== preset.colors[key]) colors[key] = value;
  }

  const fonts = {} as Record<FontRole, string | null>;
  for (const role of Object.keys(FONT_OPTIONS) as FontRole[]) {
    const value = text(formData, `font_${role}`);
    if (value && !isFontKey(role, value)) return { error: "Choose a font from the list" };
    fonts[role] = value && value !== preset.fonts[role] ? value : null;
  }

  const data = {
    presetKey,
    colors,
    serifFont: fonts.serif,
    scriptFont: fonts.script,
    sansFont: fonts.sans,
  };
  await prisma.weddingTheme.upsert({
    where: { weddingId: wedding.id },
    update: data,
    create: { ...data, weddingId: wedding.id },
  });

  revalidateWedding(wedding);
  return { success: true };
}

const URL_PATTERN = /^https?:\/\/\S+$/i;

export async function saveCopy(
  weddingId: string,
  _prevState: DesignFormState,
  formData: FormData
): Promise<DesignFormState> {
  const { wedding } = await requireWeddingAccess(weddingId);

  const data: Record<string, string | boolean | null> = {};
  for (const { key, label } of COPY_FIELDS) {
    const value = text(formData, key);
    if (value.length > COPY_MAX_LENGTH) return { error: `${label} is too long` };
    data[key] = value || null;
  }

  const footerCredit = text(formData, "footerCredit");
  const footerCreditUrl = text(formData, "footerCreditUrl");
  if (footerCredit.length > 80) return { error: "Footer credit is too long" };
  if (footerCreditUrl && !URL_PATTERN.test(footerCreditUrl)) {
    return { error: "Footer link must start with http:// or https://" };
  }
  const asoebiFabric = text(formData, "asoebiFabric");
  if (asoebiFabric.length > 200) return { error: "Asoebi description is too long" };

  Object.assign(data, {
    footerCredit: footerCredit || null,
    footerCreditUrl: footerCreditUrl || null,
    asoebiEnabled: formData.get("asoebiEnabled") === "on",
    asoebiFabric: asoebiFabric || null,
  });

  await prisma.weddingCopy.upsert({
    where: { weddingId: wedding.id },
    update: data,
    create: { ...data, weddingId: wedding.id },
  });

  revalidateWedding(wedding);
  return { success: true };
}
