"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createPresignedUploadUrl } from "@/lib/s3";
import { verifySession } from "@/lib/dal";

export type StoryBeatFormState = { error?: string; success?: boolean } | undefined;

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export type CreateStoryBeatUploadUrlState =
  | { error?: string; uploadUrl?: string; publicUrl?: string }
  | undefined;

export async function createStoryBeatUploadUrl(
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<CreateStoryBeatUploadUrlState> {
  await verifySession();

  if (!fileType.startsWith("image/")) {
    return { error: "Only image files are allowed" };
  }
  if (fileSize > MAX_FILE_SIZE) {
    return { error: "Image is over the 25MB limit" };
  }

  const { uploadUrl, publicUrl } = await createPresignedUploadUrl("story-beats", fileName, fileType);
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
  _prevState: StoryBeatFormState,
  formData: FormData
): Promise<StoryBeatFormState> {
  await verifySession();

  const meta = parseStoryBeatMeta(formData);
  if ("error" in meta) return { error: meta.error };

  const photoUrl = resolvePhotoUrl(formData);

  await prisma.storyBeat.create({ data: { ...meta.data, photoUrl } });

  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
}

export async function updateStoryBeat(
  _prevState: StoryBeatFormState,
  formData: FormData
): Promise<StoryBeatFormState> {
  await verifySession();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing beat id" };

  const meta = parseStoryBeatMeta(formData);
  if ("error" in meta) return { error: meta.error };

  const existingPhotoUrl = formData.get("existingPhotoUrl");
  const photoUrl = resolvePhotoUrl(
    formData,
    typeof existingPhotoUrl === "string" ? existingPhotoUrl : null
  );

  await prisma.storyBeat.update({ where: { id }, data: { ...meta.data, photoUrl } });

  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
}

export async function deleteStoryBeat(id: string) {
  await verifySession();

  await prisma.storyBeat.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/");
}
