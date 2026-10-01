import { Suspense } from "react";
import Link from "next/link";
import Lightbox from "@/components/guest/lightbox";
import { canLoadMore, SHOWN_STEP, shownParam } from "@/lib/shown-param";
import LiveRefresh from "@/components/live-refresh";
import GuestNav from "@/components/guest/nav";
import NavSkeleton from "@/components/guest/nav-skeleton";
import GalleryUpload from "@/components/guest/gallery-upload";
import GalleryGridSkeleton from "@/components/guest/gallery-grid-skeleton";
import Footer from "@/components/guest/footer";
import FooterSkeleton from "@/components/guest/footer-skeleton";
import { prisma } from "@/lib/prisma";
import { copyText } from "@/lib/copy";
import { hasFeature } from "@/lib/plans";
import { getGuestAccess } from "@/lib/guest-access";
import { getStory } from "@/lib/tenant";

async function GalleryGrid({ weddingId, shown }: { weddingId: string; shown: number }) {
  const where = { weddingId, status: "APPROVED" as const };
  const [media, total] = await Promise.all([
    prisma.media.findMany({ where, orderBy: { createdAt: "desc" }, take: shown }),
    prisma.media.count({ where }),
  ]);

  if (total === 0) {
    return (
      <p className="text-center font-(family-name:--serif) text-xl text-foreground/80 italic">
        Be the first to share a photo from the day.
      </p>
    );
  }

  return (
    <>
      <Lightbox items={media.map((m) => ({ id: m.id, url: m.url, type: m.type, guestName: m.guestName }))} />
      {canLoadMore(total, shown) && (
        <div className="mt-10 text-center">
          <Link href={`?shown=${shown + SHOWN_STEP}`} scroll={false} className="guest-btn">
            Load more
          </Link>
        </div>
      )}
      {total > shown && !canLoadMore(total, shown) && (
        <p className="mt-10 text-center text-[15px] text-foreground/70">Showing the latest {shown} of {total} photos.</p>
      )}
    </>
  );
}

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ shown?: string | string[] }>;
}) {
  const { slug } = await params;
  const shown = shownParam((await searchParams).shown);
  const { wedding, block } = await getGuestAccess(slug);
  if (block) return null; // the layout explains why
  const story = await getStory(wedding.id);
  const galleryEnabled = (story?.galleryEnabled ?? false) && hasFeature(wedding.plan, "gallery");

  return (
    <div>
      <LiveRefresh />
      <Suspense fallback={<NavSkeleton />}>
        <GuestNav weddingId={wedding.id} slug={wedding.slug} />
      </Suspense>
      <main className="bg-ivory px-4 pt-32 pb-24 sm:px-6">
        {galleryEnabled ? (
          <>
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-olive">
                Photo wall
              </p>
              <h1 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">
                Share your moments with us
              </h1>
              <p className="mt-6 text-base text-foreground/80 sm:text-lg">
                {copyText(wedding.copy, "galleryIntro")}
              </p>
            </div>

            <div className="mt-14">
              <GalleryUpload allowVideo={hasFeature(wedding.plan, "video")} />
            </div>

            <div className="mx-auto mt-20 max-w-5xl">
              <Suspense fallback={<GalleryGridSkeleton />}>
                <GalleryGrid weddingId={wedding.id} shown={shown} />
              </Suspense>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-olive">
              Photo wall
            </p>
            <h1 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">
              Opening on the big day
            </h1>
            <p className="mt-6 text-base text-foreground/80 sm:text-lg">
              The photo wall isn&apos;t open yet. Check back on the wedding day
              to share and see photos from the celebration.
            </p>
          </div>
        )}
      </main>
      <Suspense fallback={<FooterSkeleton />}>
        <Footer weddingId={wedding.id} />
      </Suspense>
    </div>
  );
}
