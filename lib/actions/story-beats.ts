"use server";

import { requireWeddingAccess } from "@/lib/dal";
import { createPresignedUploadUrl } from "@/lib/s3";
import { revalidateWedding } from "@/lib/tenant";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, weddingUploadFolder } from "@/lib/uploads";

export type StoryBeatFormState = { error?: string; success?: boolean } | undefined;

export type CreateStoryBeatUploadUrlState =
  | { error?: string; uploadUrl?: string; publicUrl?: string }
  | undefined;

export async function createStoryBeatUploadUrl(
  weddingId: string,
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<CreateStoryBeatUploadUrlState> {
  const { wedding } = await requireWeddingAccess(weddingId);

  if (!fileType.startsWith("image/")) {
    return { error: "Only image files are allowed" };
  }
  if (fileSize > MAX_UPLOAD_BYTES) {
    return { error: `Image is over the ${MAX_UPLOAD_LABEL} limit` };
  }

  const { uploadUrl, publicUrl } = await createPresignedUploadUrl(
    weddingUploadFolder(wedding.id, "story-beats"),
    fileName,
    fileType
  );
  return { uploadUrl, publicUrl };
}

function parseStoryBeatMeta(formData: FormData) {
  const year = formData.get("year");
  const title = formData.get("title");
  const text = formData.get("text");
  const order = formData.get("order");

  if (typeof year !== "string" || !year.trim()) {
    return { error: "Label is required" } as const;
  }
  if (typeof title !== "string" || !title.trim()) {
    return { error: "Title is required" } as const;
  }
  if (typeof text !== "string" || !text.trim()) {
    return { error: "Story text is required" } as const;
  }

  const orderNum = Number(order);

  return {
    data: {
      year: year.trim(),
      title: title.trim(),
      text: text.trim(),
      order: Number.isFinite(orderNum) ? Math.round(orderNum) : 0,
    },
  } as const;
}

function resolvePhotoUrl(formData: FormData, existingUrl?: string | null) {
  const url = formData.get("photoUrl");
  if (typeof url === "string" && url) return url;
  return existingUrl ?? null;
}

export async function addStoryBeat(
  weddingId: string,
  _prevState: StoryBeatFormState,
  formData: FormData
): Promise<StoryBeatFormState> {
  const { wedding, db } = await requireWeddingAccess(weddingId);

  const meta = parseStoryBeatMeta(formData);
  if ("error" in meta) return { error: meta.error };

  const photoUrl = resolvePhotoUrl(formData);

  await db.storyBeat.create({ data: { ...meta.data, photoUrl, weddingId: wedding.id } });

  revalidateWedding(wedding);

  return { success: true };
}

export async function updateStoryBeat(
  weddingId: string,
  _prevState: StoryBeatFormState,
  formData: FormData
): Promise<StoryBeatFormState> {
  const { wedding, db } = await requireWeddingAccess(weddingId);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing beat id" };

  const meta = parseStoryBeatMeta(formData);
  if ("error" in meta) return { error: meta.error };

  const existingPhotoUrl = formData.get("existingPhotoUrl");
  const photoUrl = resolvePhotoUrl(
    formData,
    typeof existingPhotoUrl === "string" ? existingPhotoUrl : null
  );

  await db.storyBeat.update({
    where: { id, weddingId: wedding.id },
    data: { ...meta.data, photoUrl },
  });

  revalidateWedding(wedding);

  return { success: true };
}

export async function deleteStoryBeat(weddingId: string, id: string) {
  const { wedding, db } = await requireWeddingAccess(weddingId);

  await db.storyBeat.delete({ where: { id, weddingId: wedding.id } });

  revalidateWedding(wedding);
}
