import { coupleNames } from "@/lib/layouts";
import { toWhatsAppNumber } from "@/lib/phone";
import { getStory, getWeddingById } from "@/lib/tenant";
import SectionShell, { type SectionFrame } from "./layout/section-shell";

/** The asoebi fabric and a WhatsApp link to order it, from the Wording tab and Our Story. */
export default async function Asoebi({ weddingId, frame }: { weddingId: string; frame: SectionFrame }) {
  const [wedding, story] = await Promise.all([getWeddingById(weddingId), getStory(weddingId)]);
  const fabric = wedding.copy?.asoebiFabric;
  const phone = story?.bridePhone;
  if (!fabric && !phone) return null;

  const whatsapp = phone
    ? `https://wa.me/${toWhatsAppNumber(phone, wedding.phoneCountryCode)}?text=${encodeURIComponent(
        `Hi ${coupleNames(story, frame.nameStyle)[0]}! I'd like to order my asoebi for the wedding.`
      )}`
    : null;
  const bold = frame.template === "owambe";

  return (
    <SectionShell id="asoebi" frame={frame} eyebrow="Asoebi" title="Dress with us" width="max-w-xl">
      <div className={`flex flex-col items-center gap-5 p-8 text-center ${bold ? "bg-olive-dark text-ivory" : "bg-white"}`}>
        {fabric && (
          <p className="font-(family-name:--serif) text-2xl leading-snug">
            {fabric}
          </p>
        )}
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              bold ? "bg-ivory text-foreground hover:bg-cream" : "bg-burnt-orange text-ivory hover:bg-burnt-orange-dark"
            }`}
          >
            Order on WhatsApp
          </a>
        )}
      </div>
    </SectionShell>
  );
}
