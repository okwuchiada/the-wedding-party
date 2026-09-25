import { Suspense } from "react";
import { copyText } from "@/lib/copy";
import type { TemplateKey } from "@/lib/layouts";
import { prisma } from "@/lib/prisma";
import { getWeddingById } from "@/lib/tenant";
import CopyRow from "./copy-row";
import SectionShell, { type SectionFrame } from "./layout/section-shell";
import MonetaryGiftSkeleton from "./monetary-gift-skeleton";

async function MonetaryGiftCard({ weddingId, template }: { weddingId: string; template: TemplateKey }) {
  const bankDetails = await prisma.bankDetails.findUnique({ where: { weddingId } });
  if (!bankDetails?.account) return null;

  const dark = template !== "minimal";
  const surface = {
    classic: "bg-olive-dark p-9 text-ivory shadow-[0_26px_50px_-28px_rgb(var(--ink)/0.55)] sm:rotate-[-0.6deg]",
    editorial: "bg-foreground p-9 text-ivory",
    minimal: "border-y border-olive/30 py-6 text-left",
    owambe: "bg-burnt-orange p-9 text-ivory",
  }[template];

  return (
    <div className={surface}>
      <div className="font-(family-name:--serif) text-2xl italic">Account details</div>
      <div className={`mb-4 text-xs ${dark ? "text-ivory/60" : "text-foreground/55"}`}>Tap any line to copy</div>
      <CopyRow tone={dark ? "dark" : "light"} label="Account name" value={bankDetails.name} />
      <CopyRow tone={dark ? "dark" : "light"} label="Bank" value={bankDetails.bank} />
      <CopyRow tone={dark ? "dark" : "light"} label="Account no." value={bankDetails.account} />
      {bankDetails.swift && <CopyRow tone={dark ? "dark" : "light"} label="SWIFT / BIC" value={bankDetails.swift} />}
      <div className={`mt-4.5 text-xs ${dark ? "text-ivory/60" : "text-foreground/55"}`}>
        Please include your name as the reference, so we know who to thank &#9825;
      </div>
    </div>
  );
}

export default async function MonetaryGift({ weddingId, frame }: { weddingId: string; frame: SectionFrame }) {
  const wedding = await getWeddingById(weddingId);
  const intro = copyText(wedding.copy, "giftIntro");
  const card = (
    <Suspense fallback={<MonetaryGiftSkeleton />}>
      <MonetaryGiftCard weddingId={weddingId} template={frame.template} />
    </Suspense>
  );

  // Classic keeps its original two-column layout.
  if (frame.template === "classic") {
    return (
      <section id="monetary-gift" className="bg-ivory py-20 pl-4 sm:py-28">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-3 text-xs tracking-[0.2em] text-olive uppercase">Beyond the Registry</p>
            <h2 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">A Monetary Gift</h2>
            <p className="mt-4.5 max-w-md text-base text-foreground/80">{intro}</p>
          </div>
          {card}
        </div>
      </section>
    );
  }

  return (
    <SectionShell id="monetary-gift" frame={frame} eyebrow="Beyond the registry" title="A monetary gift" intro={intro} width={frame.template === "minimal" ? "max-w-md" : "max-w-xl"}>
      {card}
    </SectionShell>
  );
}
