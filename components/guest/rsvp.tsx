import { copyText } from "@/lib/copy";
import { getWeddingById } from "@/lib/tenant";
import SectionShell, { type SectionFrame } from "./layout/section-shell";
import RsvpForm from "./rsvp-form";

export default async function Rsvp({ weddingId, frame }: { weddingId: string; frame: SectionFrame }) {
  const wedding = await getWeddingById(weddingId);
  return (
    <SectionShell
      id="rsvp"
      frame={frame}
      classicTone="cream"
      eyebrow="RSVP"
      title="Will you join us?"
      intro={copyText(wedding.copy, "rsvpIntro")}
      width="max-w-5xl"
    >
      <RsvpForm />
    </SectionShell>
  );
}
