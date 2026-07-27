import RsvpForm from "./rsvp-form";

export default function Rsvp() {
  return (
    <section id="rsvp" className="bg-ivory px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-olive">RSVP</p>
        <h2 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">
          Will you join us?
        </h2>
        <p className="mt-6 text-base text-foreground/80 sm:text-lg">
          We&apos;d love to celebrate with you. Please let us know if you&apos;ll
          be able to make it.
        </p>
      </div>

      <div className="mt-14">
        <RsvpForm />
      </div>
    </section>
  );
}
