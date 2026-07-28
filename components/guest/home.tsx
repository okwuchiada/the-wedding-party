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

export default function GuestHome() {
  return (
    <div>
      <LiveRefresh />
      <Suspense fallback={<NavSkeleton />}>
        <GuestNav />
      </Suspense>
      <main>
        <Suspense fallback={<HeroSkeleton />}>
          <Hero />
        </Suspense>
        <HowWeMet />
        <LoveNotes />
        <Registry />
        <MonetaryGift />
        <Rsvp />
      </main>
      <Suspense fallback={<FooterSkeleton />}>
        <Footer />
      </Suspense>
    </div>
  );
}
