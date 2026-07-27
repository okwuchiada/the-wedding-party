"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uploadFileToS3 } from "@/lib/s3";
import { verifySession } from "@/lib/dal";

export type StoryPhotoFormState = { error?: string; success?: boolean } | undefined;

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function parseStoryPhotoMeta(formData: FormData) {
  const caption = formData.get("caption");
  const order = formData.get("order");
  const showInHero = formData.get("showInHero");

  if (typeof caption !== "string" || !caption.trim()) {
    return { error: "Caption is required" } as const;
  }

  const orderNum = Number(order);

  return {
    data: {
      caption: caption.trim(),
      order: Number.isFinite(orderNum) ? Math.round(orderNum) : 0,
      showInHero: showInHero === "on",
    },
  } as const;
}

async function resolvePhotoUrl(formData: FormData, existingUrl?: string) {
  const file = formData.get("file");

  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return { error: "Only image files are allowed" } as const;
    }
    if (file.size > MAX_FILE_SIZE) {
      return { error: "Image is over the 25MB limit" } as const;
    }
    const url = await uploadFileToS3(file, "story-photos");
    return { url } as const;
  }

  if (existingUrl) return { url: existingUrl } as const;

  return { error: "Please choose a photo" } as const;
}

export async function addStoryPhoto(
  _prevState: StoryPhotoFormState,
  formData: FormData
): Promise<StoryPhotoFormState> {
  await verifySession();

  const meta = parseStoryPhotoMeta(formData);
  if ("error" in meta) return { error: meta.error };

  const resolved = await resolvePhotoUrl(formData);
  if ("error" in resolved) return { error: resolved.error };

  await prisma.storyPhoto.create({ data: { ...meta.data, url: resolved.url } });

  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
}

export async function updateStoryPhoto(
  _prevState: StoryPhotoFormState,
  formData: FormData
): Promise<StoryPhotoFormState> {
  await verifySession();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing photo id" };

  const meta = parseStoryPhotoMeta(formData);
  if ("error" in meta) return { error: meta.error };

  const existingUrl = formData.get("existingUrl");
  const resolved = await resolvePhotoUrl(
    formData,
    typeof existingUrl === "string" ? existingUrl : undefined
  );
  if ("error" in resolved) return { error: resolved.error };

  await prisma.storyPhoto.update({ where: { id }, data: { ...meta.data, url: resolved.url } });

  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
}

export async function deleteStoryPhoto(id: string) {
  await verifySession();

  await prisma.storyPhoto.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/");
}
