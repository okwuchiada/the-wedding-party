import { prisma } from "@/lib/prisma";

export default async function Footer() {
  const story = await prisma.storyContent.findUnique({ where: { id: "main" } });

  const brideName = story?.brideName ?? "";
  const groomName = story?.groomName ?? "";
  const location = story?.location ?? "";
  const weddingDateISO = (story?.weddingDate ?? new Date()).toISOString();

  const weddingDate = new Date(weddingDateISO).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  const contactEmail = story?.contactEmail ?? ``;
  const bridePhone = story?.bridePhone ?? "";
  const groomPhone = story?.groomPhone ?? "";
  const hasRsvpContacts = Boolean(bridePhone || groomPhone);

  return (
    <footer className="bg-foreground px-4 py-16 text-center sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="font-(family-name:--serif) text-4xl text-ivory sm:text-5xl">
          {brideName} <span className="text-burnt-orange italic">&amp;</span>{" "}
          {groomName}
        </div>
        <div className="mt-3.5 text-xs tracking-[0.3em] text-ivory/60 uppercase">
          {weddingDate} &middot; {location}
        </div>
        <div className="mx-auto my-7 h-px w-10 bg-ivory/25" />
        {hasRsvpContacts && (
          <div className="mb-3 text-xs text-ivory/60">
            RSVP by phone —{" "}
            {bridePhone && (
              <a
                href={`tel:${bridePhone}`}
                className="text-ivory/80 hover:text-burnt-orange"
              >
                {brideName} {bridePhone}
              </a>
            )}
            {bridePhone && groomPhone && " · "}
            {groomPhone && (
              <a
                href={`tel:${groomPhone}`}
                className="text-ivory/80 hover:text-burnt-orange"
              >
                {groomName} {groomPhone}
              </a>
            )}
          </div>
        )}
        <div className="text-xs text-ivory/40">
          Made with love by{" "}
          <a
            href="https://adaokwuchi.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="font-(family-name:--script) text-base text-ivory/50 transition-colors hover:text-burnt-orange"
          >
            Salem
          </a>{" "}
          &middot; Questions? {contactEmail}
        </div>
      </div>
    </footer>
  );
}
