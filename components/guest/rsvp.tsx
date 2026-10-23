import { prisma } from "@/lib/prisma";
import RsvpForm from "./rsvp-form";

export default async function Rsvp() {
  const story = await prisma.storyContent.findUnique({
    where: { id: "main" },
    select: { rsvpOpen: true },
  });
  const rsvpOpen = story?.rsvpOpen ?? true;

  return (
    <section id="rsvp" className="bg-cream px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-olive">RSVP</p>
        <h2 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">
          Will you join us?
        </h2>
        <p className="mt-6 text-base text-foreground/80 sm:text-lg">
          {rsvpOpen ? (
            <>
              We&apos;d love to celebrate with you. Please let us know if you&apos;ll
              be able to make it.
            </>
          ) : (
            <>
              RSVPs are closed right now. If you need to reach us about your
              RSVP, please contact the couple directly.
            </>
          )}
        </p>
      </div>

      {rsvpOpen && (
        <div className="mt-14">
          <RsvpForm />
        </div>
      )}
    </section>
  );
}
