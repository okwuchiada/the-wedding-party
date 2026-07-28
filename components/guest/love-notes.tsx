import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import LoveNotesSkeleton from "./love-notes-skeleton";

function LoveNoteCard({
  to,
  from,
  note,
  tilt,
}: {
  to: string;
  from: string;
  note: string;
  tilt: number;
}) {
  return (
    <figure
      style={{ ["--r" as string]: `${tilt}deg` } as React.CSSProperties}
      className="rotate-(--r) border border-olive/15 bg-white p-8 pb-7 shadow-[0_20px_44px_-24px_rgba(58,46,40,0.4)]"
    >
      <div className="mb-4 text-xs uppercase tracking-[0.2em] text-olive">
        {/* To {to}, from {from} */}
      </div>
      <blockquote className="font-(family-name:--serif) text-xl leading-relaxed text-foreground italic">
        &ldquo;{note}&rdquo;
      </blockquote>
      <figcaption className="mt-4.5 text-xs tracking-[0.12em] text-burnt-orange uppercase">
        - {from}
      </figcaption>
    </figure>
  );
}

async function LoveNotesContent() {
  const story = await prisma.storyContent.findUnique({ where: { id: "main" } });

  const notes = [
    story?.brideNote && {
      to: story.groomName,
      from: story.brideName,
      note: story.brideNote,
      tilt: -1.5,
    },
    story?.groomNote && {
      to: story.brideName,
      from: story.groomName,
      note: story.groomNote,
      tilt: 1.5,
    },
  ].filter((n): n is { to: string; from: string; note: string; tilt: number } =>
    Boolean(n),
  );

  if (notes.length === 0) return null;

  return (
    <div
      className={`mx-auto grid max-w-4xl grid-cols-1 gap-10 ${
        notes.length > 1 ? "sm:grid-cols-2" : ""
      }`}
    >
      {notes.map((n) => (
        <LoveNoteCard
          key={n.from}
          to={n.to}
          from={n.from}
          note={n.note}
          tilt={n.tilt}
        />
      ))}
    </div>
  );
}

export default function LoveNotes() {
  return (
    <section id="love-notes" className="bg-cream px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-olive">
          Just Between Us
        </p>
        <h2 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">
          Love Notes to Each Other
        </h2>
        <p className="mt-4 text-base text-foreground/70">
          A few words we wanted to say to one another, out loud, before the day
          arrives.
        </p>
      </div>

      <div className="mt-14">
        <Suspense fallback={<LoveNotesSkeleton />}>
          <LoveNotesContent />
        </Suspense>
      </div>
    </section>
  );
}
