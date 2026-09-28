"use server";

import { requireWeddingAccess } from "@/lib/dal";
import { revalidateWedding } from "@/lib/tenant";
import { deleteUnusedUploads } from "@/lib/upload-cleanup";

export type SaveStoryState = { error?: string; success?: boolean } | undefined;

export async function saveStory(
  weddingId: string,
  _prevState: SaveStoryState,
  formData: FormData
): Promise<SaveStoryState> {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "saveStory");

  const brideName = formData.get("brideName");
  const groomName = formData.get("groomName");
  const weddingDate = formData.get("weddingDate");
  const weddingTime = formData.get("weddingTime");
  const tagline = formData.get("tagline");
  const location = formData.get("location");
  const venueAddress = formData.get("venueAddress");
  const howWeMet = formData.get("howWeMet");
  const whatWeLove = formData.get("whatWeLove");
  const groomNote = formData.get("groomNote");
  const brideNote = formData.get("brideNote");
  const heroPhotoUrl = formData.get("heroPhotoUrl");
  const contactEmail = formData.get("contactEmail");
  const bridePhone = formData.get("bridePhone");
  const groomPhone = formData.get("groomPhone");

  if (typeof brideName !== "string" || !brideName.trim()) {
    return { error: "Bride's name is required" };
  }
  if (typeof groomName !== "string" || !groomName.trim()) {
    return { error: "Groom's name is required" };
  }
  if (typeof weddingDate !== "string" || !weddingDate) {
    return { error: "Wedding date is required" };
  }
  if (typeof weddingTime !== "string" || !weddingTime) {
    return { error: "Wedding time is required" };
  }
  // Stored as the literal UTC value so it always displays as entered, with no
  // timezone conversion — see components/guest/hero.tsx.
  const parsedDate = new Date(`${weddingDate}T${weddingTime}:00Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    return { error: "Enter a valid wedding date and time" };
  }
  if (typeof contactEmail === "string" && contactEmail.trim() && !contactEmail.includes("@")) {
    return { error: "Enter a valid contact email" };
  }

  const data = {
    brideName: brideName.trim(),
    groomName: groomName.trim(),
    weddingDate: parsedDate,
    tagline: typeof tagline === "string" && tagline.trim() ? tagline.trim() : null,
    location: typeof location === "string" && location.trim() ? location.trim() : null,
    venueAddress:
      typeof venueAddress === "string" && venueAddress.trim() ? venueAddress.trim() : null,
    howWeMet: typeof howWeMet === "string" && howWeMet.trim() ? howWeMet.trim() : null,
    whatWeLove: typeof whatWeLove === "string" && whatWeLove.trim() ? whatWeLove.trim() : null,
    groomNote: typeof groomNote === "string" && groomNote.trim() ? groomNote.trim() : null,
    brideNote: typeof brideNote === "string" && brideNote.trim() ? brideNote.trim() : null,
    heroPhotoUrl: typeof heroPhotoUrl === "string" && heroPhotoUrl.trim() ? heroPhotoUrl.trim() : null,
    contactEmail: typeof contactEmail === "string" && contactEmail.trim() ? contactEmail.trim() : null,
    bridePhone: typeof bridePhone === "string" && bridePhone.trim() ? bridePhone.trim() : null,
    groomPhone: typeof groomPhone === "string" && groomPhone.trim() ? groomPhone.trim() : null,
  };

  const previous = await db.storyContent.findUnique({ where: { weddingId: wedding.id }, select: { heroPhotoUrl: true } });
  await db.storyContent.upsert({
    where: { weddingId: wedding.id },
    update: data,
    create: { ...data, weddingId: wedding.id },
  });
  if (previous?.heroPhotoUrl && previous.heroPhotoUrl !== data.heroPhotoUrl) {
    await deleteUnusedUploads(db, wedding.id, [previous.heroPhotoUrl]);
  }

  revalidateWedding(wedding);

  return { success: true };
}

export async function setGalleryEnabled(weddingId: string, enabled: boolean) {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "setGalleryEnabled");

  await db.storyContent.upsert({
    where: { weddingId: wedding.id },
    update: { galleryEnabled: enabled === true },
    create: {
      weddingId: wedding.id,
      brideName: "",
      groomName: "",
      weddingDate: new Date(),
      galleryEnabled: enabled === true,
    },
  });

  revalidateWedding(wedding);
}
