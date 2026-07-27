"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uploadFileToS3 } from "@/lib/s3";
import { verifySession } from "@/lib/dal";

const ALLOWED_TYPES = ["image/", "video/"];
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export type UploadMediaState = { error?: string; success?: boolean } | undefined;

export async function uploadMedia(
  _prevState: UploadMediaState,
  formData: FormData
): Promise<UploadMediaState> {
  const guestName = formData.get("guestName");
  const file = formData.get("file");

  if (typeof guestName !== "string" || !guestName.trim()) {
    return { error: "Please enter your name" };
  }
  if (!(file instanceof File)) {
    return { error: "Missing file" };
  }
  if (!ALLOWED_TYPES.some((prefix) => file.type.startsWith(prefix))) {
    return { error: "Only photos and videos are allowed" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "File is over the 25MB limit" };
  }

  const type = file.type.startsWith("video/") ? "VIDEO" : "PHOTO";
  const url = await uploadFileToS3(file, "uploads");

  await prisma.media.create({
    data: { guestName: guestName.trim(), url, type, status: "PENDING" },
  });

  revalidatePath("/admin");

  return { success: true };
}

export async function approveMedia(id: string) {
  await verifySession();
  await prisma.media.update({ where: { id }, data: { status: "APPROVED" } });
  revalidatePath("/admin");
  revalidatePath("/gallery");
}

export async function hideMedia(id: string) {
  await verifySession();
  await prisma.media.update({ where: { id }, data: { status: "HIDDEN" } });
  revalidatePath("/admin");
  revalidatePath("/gallery");
}

export async function deleteMedia(id: string) {
  await verifySession();
  await prisma.media.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/gallery");
}
