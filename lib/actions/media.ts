"use server";

import { requireWeddingAccess } from "@/lib/dal";
import { hasFeature, uploadsLeft } from "@/lib/plans";
import { createPresignedUploadUrl, publicUrlForKey } from "@/lib/s3";
import { resolveGuestAction, revalidateDashboard, revalidateWedding } from "@/lib/tenant";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, weddingUploadFolder } from "@/lib/uploads";

const GUEST_UPLOAD_FOLDER = "uploads";

export type CreateUploadUrlState =
  | { error?: string; uploadUrl?: string; publicUrl?: string }
  | undefined;

/** Guests can upload only while the couple has the gallery open. */
async function resolveGalleryWedding(slug: string) {
  const guest = await resolveGuestAction(slug);
  if (!guest || !hasFeature(guest.wedding.plan, "gallery")) return null;
  const story = await guest.db.storyContent.findUnique({
    where: { weddingId: guest.wedding.id },
    select: { galleryEnabled: true },
  });
  return story?.galleryEnabled ? guest : null;
}

export async function createMediaUploadUrl(
  slug: string,
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<CreateUploadUrlState> {
  const guest = await resolveGalleryWedding(slug);
  if (!guest) return { error: "The gallery isn't open yet" };

  const allowVideo = hasFeature(guest.wedding.plan, "video");
  const isVideo = fileType.startsWith("video/");
  if (!fileType.startsWith("image/") && !isVideo) {
    return { error: allowVideo ? "Only photos and videos are allowed" : "Only photos are allowed" };
  }
  if (isVideo && !allowVideo) return { error: "This gallery takes photos only" };
  const limitError = await uploadLimitError(guest);
  if (limitError) return { error: limitError };
  if (fileSize > MAX_UPLOAD_BYTES) {
    return { error: `File is over the ${MAX_UPLOAD_LABEL} limit` };
  }

  const { uploadUrl, publicUrl } = await createPresignedUploadUrl(
    weddingUploadFolder(guest.wedding.id, GUEST_UPLOAD_FOLDER),
    fileName,
    fileType
  );
  return { uploadUrl, publicUrl };
}

/** Every stored guest upload counts against the plan's limit, hidden and pending ones too. */
async function uploadLimitError(guest: NonNullable<Awaited<ReturnType<typeof resolveGalleryWedding>>>) {
  if (guest.wedding.plan?.maxUploads == null) return null;
  const used = await guest.db.media.count({ where: { weddingId: guest.wedding.id } });
  return uploadsLeft(guest.wedding.plan, used) === 0 ? "The gallery is full. Thank you for sharing!" : null;
}

export type CreateMediaState = { error?: string; success?: boolean; id?: string } | undefined;

export async function createMediaRecord(
  slug: string,
  guestName: string,
  url: string,
  type: "PHOTO" | "VIDEO"
): Promise<CreateMediaState> {
  const guest = await resolveGalleryWedding(slug);
  if (!guest) return { error: "The gallery isn't open yet" };
  const { wedding, db } = guest;

  if (!guestName.trim()) return { error: "Please enter your name" };
  if (type !== "PHOTO" && type !== "VIDEO") return { error: "Unsupported file type" };
  if (type === "VIDEO" && !hasFeature(wedding.plan, "video")) return { error: "This gallery takes photos only" };
  const limitError = await uploadLimitError(guest);
  if (limitError) return { error: limitError };
  // Only accept files uploaded through createMediaUploadUrl for this wedding.
  const allowedPrefix = publicUrlForKey(`${weddingUploadFolder(wedding.id, GUEST_UPLOAD_FOLDER)}/`);
  if (typeof url !== "string" || !url.startsWith(allowedPrefix)) {
    return { error: "Missing upload URL" };
  }

  const media = await db.media.create({
    data: { weddingId: wedding.id, guestName: guestName.trim(), url, type, status: "PENDING" },
  });

  revalidateDashboard(wedding);

  return { success: true, id: media.id };
}

export async function getMediaStatuses(slug: string, ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) return {};
  const guest = await resolveGuestAction(slug);
  if (!guest) return {};

  const rows = await guest.db.media.findMany({
    where: { weddingId: guest.wedding.id, id: { in: ids.slice(0, 100) } },
    select: { id: true, status: true },
  });

  return Object.fromEntries(rows.map((row) => [row.id, row.status]));
}

export async function approveMedia(weddingId: string, id: string) {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "approveMedia");
  await db.media.update({ where: { id, weddingId: wedding.id }, data: { status: "APPROVED" } });
  revalidateWedding(wedding);
}

export async function hideMedia(weddingId: string, id: string) {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "hideMedia");
  await db.media.update({ where: { id, weddingId: wedding.id }, data: { status: "HIDDEN" } });
  revalidateWedding(wedding);
}

export async function deleteMedia(weddingId: string, id: string) {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "deleteMedia");
  await db.media.delete({ where: { id, weddingId: wedding.id } });
  revalidateWedding(wedding);
}
