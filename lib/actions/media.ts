"use server";

import { requireWeddingAccess } from "@/lib/dal";
import { hasFeature, uploadsLeft } from "@/lib/plans";
import { takeGuestRateLimit } from "@/lib/rate-limit";
import { createPresignedUploadUrl, publicUrlForKey } from "@/lib/s3";
import { deleteUnusedUploads } from "@/lib/upload-cleanup";
import { resolveGuestAction, revalidateDashboard, revalidateWedding } from "@/lib/tenant";
import { uploadSizeError, weddingUploadFolder } from "@/lib/uploads";

const GUEST_UPLOAD_FOLDER = "uploads";
const HOUR_MS = 60 * 60 * 1000;
// Per guest IP per wedding and hour. A venue's shared Wi-Fi can put a whole
// room behind one IP, so these sit well above what one guest would use.
const UPLOAD_URLS_PER_HOUR = 300;
const MEDIA_RECORDS_PER_HOUR = 300;

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
  const sizeError = uploadSizeError(fileSize);
  if (sizeError) return { error: sizeError };
  const limitError = await uploadLimitError(guest);
  if (limitError) return { error: limitError };
  if (!(await takeGuestRateLimit("upload-url", guest.wedding.id, UPLOAD_URLS_PER_HOUR, HOUR_MS))) {
    return { error: "Too many uploads at once. Please try again in a little while." };
  }

  const { uploadUrl, publicUrl } = await createPresignedUploadUrl(
    weddingUploadFolder(guest.wedding.id, GUEST_UPLOAD_FOLDER),
    fileName,
    fileType,
    fileSize
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
  if (!(await takeGuestRateLimit("media", wedding.id, MEDIA_RECORDS_PER_HOUR, HOUR_MS))) {
    return { error: "Too many uploads at once. Please try again in a little while." };
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
  const media = await db.media.delete({ where: { id, weddingId: wedding.id } });
  await deleteUnusedUploads(db, wedding.id, [media.url]);
  revalidateWedding(wedding);
}

/** Moves a photo or video to any status; used to undo an approve, hide or restore. */
export async function setMediaStatus(weddingId: string, id: string, status: "PENDING" | "APPROVED" | "HIDDEN") {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "setMediaStatus");
  await db.media.update({ where: { id, weddingId: wedding.id }, data: { status } });
  revalidateWedding(wedding);
}

/** Moves several photos or videos at once (bulk approve or hide, and undoing it). */
export async function setMediaStatusMany(weddingId: string, ids: string[], status: "PENDING" | "APPROVED" | "HIDDEN") {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "setMediaStatusMany");
  if (!Array.isArray(ids) || ids.length === 0) return;
  await db.media.updateMany({ where: { id: { in: ids.slice(0, 200) }, weddingId: wedding.id }, data: { status } });
  revalidateWedding(wedding);
}
