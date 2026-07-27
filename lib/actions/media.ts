"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createPresignedUploadUrl } from "@/lib/s3";
import { verifySession } from "@/lib/dal";

const ALLOWED_TYPES = ["image/", "video/"];
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export type CreateUploadUrlState =
  | { error?: string; uploadUrl?: string; publicUrl?: string }
  | undefined;

export async function createMediaUploadUrl(
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<CreateUploadUrlState> {
  if (!ALLOWED_TYPES.some((prefix) => fileType.startsWith(prefix))) {
    return { error: "Only photos and videos are allowed" };
  }
  if (fileSize > MAX_FILE_SIZE) {
    return { error: "File is over the 25MB limit" };
  }

  const { uploadUrl, publicUrl } = await createPresignedUploadUrl("uploads", fileName, fileType);
  return { uploadUrl, publicUrl };
}

export type CreateMediaState = { error?: string; success?: boolean; id?: string } | undefined;

export async function createMediaRecord(
  guestName: string,
  url: string,
  type: "PHOTO" | "VIDEO"
): Promise<CreateMediaState> {
  if (!guestName.trim()) return { error: "Please enter your name" };
  if (!url) return { error: "Missing upload URL" };

  const media = await prisma.media.create({
    data: { guestName: guestName.trim(), url, type, status: "PENDING" },
  });

  revalidatePath("/admin");

  return { success: true, id: media.id };
}

export async function getMediaStatuses(ids: string[]) {
  if (ids.length === 0) return {};

  const rows = await prisma.media.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true },
  });

  return Object.fromEntries(rows.map((row) => [row.id, row.status]));
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
