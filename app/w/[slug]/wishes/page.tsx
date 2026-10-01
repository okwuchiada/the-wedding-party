import { Suspense } from "react";
import Link from "next/link";
import { canLoadMore, SHOWN_STEP, shownParam } from "@/lib/shown-param";
import LiveRefresh from "@/components/live-refresh";
import GuestNav from "@/components/guest/nav";
import NavSkeleton from "@/components/guest/nav-skeleton";
import WishForm from "@/components/guest/wish-form";
import WishesListSkeleton from "@/components/guest/wishes-list-skeleton";
import Footer from "@/components/guest/footer";
import FooterSkeleton from "@/components/guest/footer-skeleton";
import { prisma } from "@/lib/prisma";
import { copyText } from "@/lib/copy";
import { getGuestAccess } from "@/lib/guest-access";

async function WishesList({ weddingId, shown }: { weddingId: string; shown: number }) {
  const where = { weddingId, status: "APPROVED" as const };
  const [wishes, total] = await Promise.all([
    prisma.wish.findMany({ where, orderBy: { createdAt: "desc" }, take: shown }),
    prisma.wish.count({ where }),
  ]);

  if (total === 0) {
    return (
      <p className="text-center font-(family-name:--serif) text-xl text-foreground/80 italic">No wishes yet. Yours could be the first.</p>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {wishes.map((wish) => (
          <li key={wish.id} className="bg-white p-5 shadow-[0_18px_40px_-20px_rgb(var(--ink)/0.45)]">
            <p className="font-(family-name:--serif) text-lg text-foreground italic">&ldquo;{wish.message}&rdquo;</p>
            <p className="mt-3 text-[13px] text-foreground/65">— {wish.guestName}</p>
          </li>
        ))}
      </ul>
      {canLoadMore(total, shown) && (
        <div className="mt-10 text-center">
          <Link href={`?shown=${shown + SHOWN_STEP}`} scroll={false} className="guest-btn">
            Load more
          </Link>
        </div>
      )}
      {total > shown && !canLoadMore(total, shown) && (
        <p className="mt-10 text-center text-[15px] text-foreground/70">Showing the latest {shown} of {total} wishes.</p>
      )}
    </>
  );
}

export default async function WishesPage({
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

  return (
    <div>
      <LiveRefresh />
      <Suspense fallback={<NavSkeleton />}>
        <GuestNav weddingId={wedding.id} slug={wedding.slug} />
      </Suspense>
      <main className="bg-ivory px-4 pt-32 pb-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-olive">
            Wishes
          </p>
          <h1 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">
            Leave the couple a wish
          </h1>
          <p className="mt-6 text-base text-foreground/80 sm:text-lg">
            {copyText(wedding.copy, "wishesIntro")}
          </p>
        </div>

        <div className="mt-14">
          <WishForm />
        </div>

        <div className="mx-auto mt-20 max-w-4xl">
          <Suspense fallback={<WishesListSkeleton />}>
            <WishesList weddingId={wedding.id} shown={shown} />
          </Suspense>
        </div>
      </main>
      <Suspense fallback={<FooterSkeleton />}>
        <Footer weddingId={wedding.id} />
      </Suspense>
    </div>
  );
}
