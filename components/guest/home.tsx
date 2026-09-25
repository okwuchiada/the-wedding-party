import { Suspense } from "react";
import LiveRefresh from "@/components/live-refresh";
import { visibleSections, type ResolvedLayout, type SectionId } from "@/lib/layouts";
import Asoebi from "./asoebi";
import Footer from "./footer";
import FooterSkeleton from "./footer-skeleton";
import Hero from "./heroes";
import HeroSkeleton from "./hero-skeleton";
import HowWeMet from "./how-we-met";
import type { SectionFrame } from "./layout/section-shell";
import LoveNotes from "./love-notes";
import MonetaryGift from "./monetary-gift";
import GuestNav from "./nav";
import NavSkeleton from "./nav-skeleton";
import Registry from "./registry";
import Rsvp from "./rsvp";
import { getSectionsWithContent } from "./section-content";

const SECTION_COMPONENTS: Record<SectionId, (props: { weddingId: string; frame: SectionFrame }) => React.ReactNode> = {
  story: HowWeMet,
  notes: LoveNotes,
  registry: Registry,
  gift: MonetaryGift,
  asoebi: Asoebi,
  rsvp: Rsvp,
};

/** The couple's home page: their chosen hero, then their sections in their order. */
export default async function GuestHome({ weddingId, slug, layout }: { weddingId: string; slug: string; layout: ResolvedLayout }) {
  // Switched on by the couple and with something to show.
  const withContent = await getSectionsWithContent(weddingId);
  const visible = visibleSections(layout).filter((id) => withContent.has(id));

  return (
    <div>
      <LiveRefresh />
      <Suspense fallback={<NavSkeleton />}>
        <GuestNav weddingId={weddingId} slug={slug} sections={visible} />
      </Suspense>
      <main data-template={layout.template}>
        <Suspense fallback={<HeroSkeleton />}>
          <Hero
            weddingId={weddingId}
            hero={layout.hero}
            template={layout.template}
            nameStyle={layout.heroNames}
            showRsvp={visible.includes("rsvp")}
            showRegistry={visible.includes("registry")}
          />
        </Suspense>
        {visible.map((id, i) => {
          const Section = SECTION_COMPONENTS[id];
          return <Section key={id} weddingId={weddingId} frame={{ template: layout.template, index: i + 1, nameStyle: layout.heroNames }} />;
        })}
      </main>
      <Suspense fallback={<FooterSkeleton />}>
        <Footer weddingId={weddingId} nameStyle={layout.heroNames} />
      </Suspense>
    </div>
  );
}
