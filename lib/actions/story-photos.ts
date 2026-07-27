"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createPresignedUploadUrl } from "@/lib/s3";
import { verifySession } from "@/lib/dal";

export type StoryPhotoFormState = { error?: string; success?: boolean } | undefined;

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export type CreateStoryPhotoUploadUrlState =
  | { error?: string; uploadUrl?: string; publicUrl?: string }
  | undefined;

export async function createStoryPhotoUploadUrl(
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<CreateStoryPhotoUploadUrlState> {
  await verifySession();

  if (!fileType.startsWith("image/")) {
    return { error: "Only image files are allowed" };
  }
  if (fileSize > MAX_FILE_SIZE) {
    return { error: "Image is over the 25MB limit" };
  }

  const { uploadUrl, publicUrl } = await createPresignedUploadUrl("story-photos", fileName, fileType);
  return { uploadUrl, publicUrl };
}

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

function resolvePhotoUrl(formData: FormData, existingUrl?: string) {
  const url = formData.get("url");
  if (typeof url === "string" && url) return { url } as const;

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

  const resolved = resolvePhotoUrl(formData);
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
  const resolved = resolvePhotoUrl(
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

export type BulkAddStoryPhotosState = { error?: string; success?: boolean } | undefined;

export async function bulkAddStoryPhotos(urls: string[]): Promise<BulkAddStoryPhotosState> {
  await verifySession();

  if (urls.length === 0) return { error: "No photos to add" };

  const last = await prisma.storyPhoto.findFirst({ orderBy: { order: "desc" } });
  const startOrder = (last?.order ?? -1) + 1;

  await prisma.storyPhoto.createMany({
    data: urls.map((url, i) => ({
      url,
      caption: "",
      order: startOrder + i,
      showInHero: false,
    })),
  });

  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
}
