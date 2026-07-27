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

  const contactEmail =
    story?.contactEmail ?? `hello@${brideName.toLowerCase()}and${groomName.toLowerCase()}.com`;

  return (
    <footer className="bg-foreground px-4 py-16 text-center sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="font-(family-name:--serif) text-4xl text-ivory sm:text-5xl">
          {brideName} <span className="text-burnt-orange italic">&amp;</span> {groomName}
        </div>
        <div className="mt-3.5 text-xs tracking-[0.3em] text-ivory/60 uppercase">
          {weddingDate} &middot; {location}
        </div>
        <div className="mx-auto my-7 h-px w-10 bg-ivory/25" />
        <div className="text-xs text-ivory/40">
          Made with love &middot; Questions? {contactEmail}
        </div>
      </div>
    </footer>
  );
}
