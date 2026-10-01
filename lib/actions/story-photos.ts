"use server";

import { requireWeddingAccess } from "@/lib/dal";
import { createPresignedUploadUrl } from "@/lib/s3";
import { deleteUnusedUploads } from "@/lib/upload-cleanup";
import { revalidateWedding } from "@/lib/tenant";
import { moveInList } from "@/lib/reorder";
import { uploadSizeError, weddingUploadFolder } from "@/lib/uploads";

export type StoryPhotoFormState = { error?: string; success?: boolean } | undefined;

export type CreateStoryPhotoUploadUrlState =
  | { error?: string; uploadUrl?: string; publicUrl?: string }
  | undefined;

export async function createStoryPhotoUploadUrl(
  weddingId: string,
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<CreateStoryPhotoUploadUrlState> {
  const { wedding } = await requireWeddingAccess(weddingId, "edit");

  if (!fileType.startsWith("image/")) {
    return { error: "Only image files are allowed" };
  }
  const sizeError = uploadSizeError(fileSize, "Image");
  if (sizeError) return { error: sizeError };

  const { uploadUrl, publicUrl } = await createPresignedUploadUrl(
    weddingUploadFolder(wedding.id, "story-photos"),
    fileName,
    fileType,
    fileSize
  );
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
  weddingId: string,
  _prevState: StoryPhotoFormState,
  formData: FormData
): Promise<StoryPhotoFormState> {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "addStoryPhoto");

  const meta = parseStoryPhotoMeta(formData);
  if ("error" in meta) return { error: meta.error };

  const resolved = resolvePhotoUrl(formData);
  if ("error" in resolved) return { error: resolved.error };

  await db.storyPhoto.create({
    data: { ...meta.data, url: resolved.url, weddingId: wedding.id },
  });

  revalidateWedding(wedding);

  return { success: true };
}

export async function updateStoryPhoto(
  weddingId: string,
  _prevState: StoryPhotoFormState,
  formData: FormData
): Promise<StoryPhotoFormState> {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "updateStoryPhoto");

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

  const previous = await db.storyPhoto.findUniqueOrThrow({ where: { id, weddingId: wedding.id }, select: { url: true } });
  await db.storyPhoto.update({
    where: { id, weddingId: wedding.id },
    data: { ...meta.data, url: resolved.url },
  });
  if (previous.url !== resolved.url) await deleteUnusedUploads(db, wedding.id, [previous.url]);

  revalidateWedding(wedding);

  return { success: true };
}

export async function deleteStoryPhoto(weddingId: string, id: string) {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "deleteStoryPhoto");

  const photo = await db.storyPhoto.delete({ where: { id, weddingId: wedding.id } });
  await deleteUnusedUploads(db, wedding.id, [photo.url]);

  revalidateWedding(wedding);
}

export type BulkAddStoryPhotosState = { error?: string; success?: boolean } | undefined;

export async function bulkAddStoryPhotos(
  weddingId: string,
  urls: string[]
): Promise<BulkAddStoryPhotosState> {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "bulkAddStoryPhotos");

  if (!Array.isArray(urls) || urls.length === 0) return { error: "No photos to add" };

  const last = await db.storyPhoto.findFirst({
    where: { weddingId: wedding.id },
    orderBy: { order: "desc" },
  });
  const startOrder = (last?.order ?? -1) + 1;

  await db.storyPhoto.createMany({
    data: urls.map((url, i) => ({
      weddingId: wedding.id,
      url,
      caption: "",
      order: startOrder + i,
      showInHero: false,
    })),
  });

  revalidateWedding(wedding);

  return { success: true };
}

/** Moves a photo one place earlier or later, renumbering every photo so the order has no ties. */
export async function moveStoryPhoto(weddingId: string, id: string, direction: "up" | "down") {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "moveStoryPhoto");
  const photos = await db.storyPhoto.findMany({ where: { weddingId: wedding.id }, orderBy: [{ order: "asc" }, { id: "asc" }], select: { id: true } });
  const ids = moveInList(photos.map((p) => p.id), id, direction);
  await db.$transaction(ids.map((photoId, i) => db.storyPhoto.update({ where: { id: photoId, weddingId: wedding.id }, data: { order: i + 1 } })));
  revalidateWedding(wedding);
}
