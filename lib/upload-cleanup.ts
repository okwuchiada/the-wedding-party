import "server-only";
import type { ScopedPrisma } from "@/lib/db-scoped";
import { deleteObjects, keyForPublicUrl } from "@/lib/s3";
import { weddingUploadFolder } from "@/lib/uploads";

/**
 * Deletes a wedding's uploaded files once no row of that wedding points at them.
 * Call after the row that used them is deleted or changed. URLs can be pasted
 * between fields, so anything still referenced is kept, and only files under the
 * wedding's own folder are ever touched (a pasted link to another wedding's
 * upload must never delete it).
 */
export async function deleteUnusedUploads(db: ScopedPrisma, weddingId: string, urls: (string | null | undefined)[]) {
  const folder = weddingUploadFolder(weddingId, "");
  const candidates = [...new Set(urls.filter((url): url is string => !!url))].filter((url) =>
    keyForPublicUrl(url)?.startsWith(folder)
  );
  if (candidates.length === 0) return;

  const [media, photos, beats, items, story] = await Promise.all([
    db.media.findMany({ where: { weddingId, url: { in: candidates } }, select: { url: true } }),
    db.storyPhoto.findMany({ where: { weddingId, url: { in: candidates } }, select: { url: true } }),
    db.storyBeat.findMany({ where: { weddingId, photoUrl: { in: candidates } }, select: { photoUrl: true } }),
    db.registryItem.findMany({ where: { weddingId, image: { in: candidates } }, select: { image: true } }),
    db.storyContent.findUnique({ where: { weddingId }, select: { heroPhotoUrl: true } }),
  ]);
  const inUse = new Set<string | null>([
    ...media.map((m) => m.url),
    ...photos.map((p) => p.url),
    ...beats.map((b) => b.photoUrl),
    ...items.map((i) => i.image),
    story?.heroPhotoUrl ?? null,
  ]);

  await deleteObjects(candidates.filter((url) => !inUse.has(url)).map((url) => keyForPublicUrl(url)!));
}
