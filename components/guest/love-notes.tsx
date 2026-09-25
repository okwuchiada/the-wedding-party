import { Suspense } from "react";
import { copyText } from "@/lib/copy";
import { coupleNames, type HeroNameStyle, type TemplateKey } from "@/lib/layouts";
import { getStory, getWeddingById } from "@/lib/tenant";
import SectionShell, { type SectionFrame } from "./layout/section-shell";
import LoveNotesSkeleton from "./love-notes-skeleton";

type Note = { from: string; note: string; tilt: number };

function LoveNoteCard({ from, note, tilt }: Note) {
  return (
    <figure
      style={{ ["--r" as string]: `${tilt}deg` } as React.CSSProperties}
      className="rotate-(--r) border border-olive/15 bg-white p-8 pb-7 shadow-[0_20px_44px_-24px_rgb(var(--ink)/0.4)]"
    >
      <blockquote className="font-(family-name:--serif) text-xl leading-relaxed text-foreground italic">
        &ldquo;{note}&rdquo;
      </blockquote>
      <figcaption className="mt-4.5 text-xs tracking-[0.12em] text-burnt-orange uppercase">- {from}</figcaption>
    </figure>
  );
}

function NotesLayout({ notes, template }: { notes: Note[]; template: TemplateKey }) {
  if (template === "editorial") {
    return (
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
        {notes.map((n) => (
          <figure key={n.from} className="border-l-2 border-burnt-orange pl-6">
            <blockquote className="font-(family-name:--serif) text-2xl leading-snug text-foreground">&ldquo;{n.note}&rdquo;</blockquote>
            <figcaption className="mt-4 text-sm text-foreground/60">{n.from}</figcaption>
          </figure>
        ))}
      </div>
    );
  }
  if (template === "minimal") {
    return (
      <div className="flex flex-col gap-10 text-center">
        {notes.map((n) => (
          <figure key={n.from}>
            <blockquote className="font-(family-name:--serif) text-xl leading-relaxed text-foreground/85 italic">&ldquo;{n.note}&rdquo;</blockquote>
            <figcaption className="mt-3 text-sm text-foreground/55">{n.from}</figcaption>
          </figure>
        ))}
      </div>
    );
  }
  if (template === "owambe") {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {notes.map((n, i) => (
          <figure key={n.from} className={`p-8 text-ivory ${i % 2 ? "bg-olive-dark" : "bg-burnt-orange"}`}>
            <blockquote className="font-(family-name:--serif) text-xl leading-relaxed">&ldquo;{n.note}&rdquo;</blockquote>
            <figcaption className="mt-4 text-xs font-semibold tracking-[0.14em] uppercase opacity-85">{n.from}</figcaption>
          </figure>
        ))}
      </div>
    );
  }
  return (
    <div className={`mx-auto grid max-w-4xl grid-cols-1 gap-10 ${notes.length > 1 ? "sm:grid-cols-2" : ""}`}>
      {notes.map((n) => (
        <LoveNoteCard key={n.from} {...n} />
      ))}
    </div>
  );
}

async function LoveNotesContent({ weddingId, template, nameStyle }: { weddingId: string; template: TemplateKey; nameStyle: HeroNameStyle }) {
  const story = await getStory(weddingId);
  const [bride, groom] = coupleNames(story, nameStyle);
  const notes = [
    story?.brideNote && { from: bride, note: story.brideNote, tilt: -1.5 },
    story?.groomNote && { from: groom, note: story.groomNote, tilt: 1.5 },
  ].filter((n): n is Note => Boolean(n));

  if (notes.length === 0) return null;
  return <NotesLayout notes={notes} template={template} />;
}

export default async function LoveNotes({ weddingId, frame }: { weddingId: string; frame: SectionFrame }) {
  const wedding = await getWeddingById(weddingId);
  return (
    <SectionShell
      id="love-notes"
      frame={frame}
      classicTone="cream"
      eyebrow="Just between us"
      title="Love notes to each other"
      intro={copyText(wedding.copy, "loveNotesIntro")}
      width={frame.template === "minimal" ? "max-w-xl" : "max-w-5xl"}
    >
      <Suspense fallback={<LoveNotesSkeleton />}>
        <LoveNotesContent weddingId={weddingId} template={frame.template} nameStyle={frame.nameStyle} />
      </Suspense>
    </SectionShell>
  );
}
