import { Suspense } from "react";
import Image from "next/image";
import LiveRefresh from "@/components/live-refresh";
import GuestNav from "@/components/guest/nav";
import NavSkeleton from "@/components/guest/nav-skeleton";
import GalleryUpload from "@/components/guest/gallery-upload";
import GalleryGridSkeleton from "@/components/guest/gallery-grid-skeleton";
import Footer from "@/components/guest/footer";
import FooterSkeleton from "@/components/guest/footer-skeleton";
import { prisma } from "@/lib/prisma";

async function GalleryGrid() {
  const media = await prisma.media.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {media.map((item) => (
        <div
          key={item.id}
          className="relative aspect-square overflow-hidden bg-olive/10"
        >
          {item.type === "VIDEO" ? (
            <video src={item.url} muted playsInline controls className="h-full w-full object-cover" />
          ) : (
            <Image
              src={item.url}
              alt={`Photo from ${item.guestName}`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default async function GalleryPage() {
  const story = await prisma.storyContent.findUnique({
    where: { id: "main" },
    select: { galleryEnabled: true },
  });
  const galleryEnabled = story?.galleryEnabled ?? false;

  return (
    <div>
      <LiveRefresh />
      <Suspense fallback={<NavSkeleton />}>
        <GuestNav />
      </Suspense>
      <main className="bg-ivory px-4 pt-32 pb-24 sm:px-6">
        {galleryEnabled ? (
          <>
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-olive">
                Gallery Wall
              </p>
              <h1 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">
                Share your moments with us
              </h1>
              <p className="mt-6 text-base text-foreground/80 sm:text-lg">
                Snap a photo or video from the celebration and share it here. The
                couple will approve it before it appears on the wall for everyone to
                see.
              </p>
            </div>

            <div className="mt-14">
              <GalleryUpload />
            </div>

            <div className="mx-auto mt-20 max-w-5xl">
              <p className="mb-6 text-center text-xs uppercase tracking-[0.2em] text-olive">
                Gallery Wall
              </p>
              <Suspense fallback={<GalleryGridSkeleton />}>
                <GalleryGrid />
              </Suspense>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-olive">
              Gallery Wall
            </p>
            <h1 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">
              Opening on the big day
            </h1>
            <p className="mt-6 text-base text-foreground/80 sm:text-lg">
              The Gallery Wall isn&apos;t open yet. Check back on the wedding day
              to share and see photos from the celebration.
            </p>
          </div>
        )}
      </main>
      <Suspense fallback={<FooterSkeleton />}>
        <Footer />
      </Suspense>
    </div>
  );
}
