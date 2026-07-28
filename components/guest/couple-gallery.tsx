import { Suspense } from "react";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import CoupleGallerySkeleton from "./couple-gallery-skeleton";

async function CoupleGalleryGrid() {
  const photos = await prisma.storyPhoto.findMany({ orderBy: { order: "asc" } });

  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo) => (
        <figure key={photo.id} className="group">
          <div className="relative aspect-square overflow-hidden bg-olive/10">
            <Image
              src={photo.url}
              alt={photo.caption}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-400 ease-out group-hover:scale-105"
            />
          </div>
          {photo.caption && (
            <figcaption className="mt-2.5 text-center font-(family-name:--serif) text-sm text-foreground/70 italic">
              {photo.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

export default function CoupleGallery() {
  return (
    <section id="couple-gallery" className="bg-ivory px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-olive">
          In Pictures
        </p>
        <h2 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">
          Moments We Love
        </h2>
      </div>

      <div className="mx-auto mt-14 max-w-5xl">
        <Suspense fallback={<CoupleGallerySkeleton />}>
          <CoupleGalleryGrid />
        </Suspense>
      </div>
    </section>
  );
}
