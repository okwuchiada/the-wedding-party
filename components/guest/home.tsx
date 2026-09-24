import { Suspense } from "react";
import LiveRefresh from "@/components/live-refresh";
import GuestNav from "./nav";
import NavSkeleton from "./nav-skeleton";
import Hero from "./hero";
import HeroSkeleton from "./hero-skeleton";
import Rsvp from "./rsvp";
import HowWeMet from "./how-we-met";
import LoveNotes from "./love-notes";
import Registry from "./registry";
import MonetaryGift from "./monetary-gift";
import Footer from "./footer";
import FooterSkeleton from "./footer-skeleton";

export default function GuestHome({ weddingId, slug }: { weddingId: string; slug: string }) {
  return (
    <div>
      <LiveRefresh />
      <Suspense fallback={<NavSkeleton />}>
        <GuestNav weddingId={weddingId} slug={slug} />
      </Suspense>
      <main>
        <Suspense fallback={<HeroSkeleton />}>
          <Hero weddingId={weddingId} />
        </Suspense>
        <HowWeMet weddingId={weddingId} />
        <LoveNotes weddingId={weddingId} />
        {/* <CoupleGallery weddingId={weddingId} /> */}
        <Registry weddingId={weddingId} />
        <MonetaryGift weddingId={weddingId} />
        <Rsvp weddingId={weddingId} />
      </main>
      <Suspense fallback={<FooterSkeleton />}>
        <Footer weddingId={weddingId} />
      </Suspense>
    </div>
  );
}
