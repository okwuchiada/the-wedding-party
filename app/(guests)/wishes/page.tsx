import { Suspense } from "react";
import GuestNav from "@/components/guest/nav";
import NavSkeleton from "@/components/guest/nav-skeleton";
import WishForm from "@/components/guest/wish-form";
import WishesListSkeleton from "@/components/guest/wishes-list-skeleton";
import Footer from "@/components/guest/footer";
import FooterSkeleton from "@/components/guest/footer-skeleton";
import { prisma } from "@/lib/prisma";

async function WishesList() {
  const wishes = await prisma.wish.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {wishes.map((wish) => (
        <div key={wish.id} className="bg-white p-5 shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)]">
          <p className="font-(family-name:--serif) text-base text-foreground italic">
            &ldquo;{wish.message}&rdquo;
          </p>
          <p className="mt-3 text-xs text-foreground/60">— {wish.guestName}</p>
        </div>
      ))}
    </div>
  );
}

export default function WishesPage() {
  return (
    <div>
      <Suspense fallback={<NavSkeleton />}>
        <GuestNav />
      </Suspense>
      <main className="bg-ivory px-4 pt-32 pb-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-olive">
            Wall of Wishes
          </p>
          <h1 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">
            Leave the couple a wish
          </h1>
          <p className="mt-6 text-base text-foreground/80 sm:text-lg">
            A few kind words mean the world. Share a wish below, and once the
            couple approves it, it&apos;ll appear on the wall for everyone to
            see.
          </p>
        </div>

        <div className="mt-14">
          <WishForm />
        </div>

        <div className="mx-auto mt-20 max-w-4xl">
          <p className="mb-8 text-center text-xs uppercase tracking-[0.2em] text-olive">
            Wishes from loved ones
          </p>
          <Suspense fallback={<WishesListSkeleton />}>
            <WishesList />
          </Suspense>
        </div>
      </main>
      <Suspense fallback={<FooterSkeleton />}>
        <Footer />
      </Suspense>
    </div>
  );
}
