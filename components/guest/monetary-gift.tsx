import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import CopyRow from "./copy-row";
import MonetaryGiftSkeleton from "./monetary-gift-skeleton";

async function MonetaryGiftCard() {
  const bankDetails = await prisma.bankDetails.findUnique({
    where: { id: "main" },
  });

  if (!bankDetails?.account) return null;

  return (
    <div className="bg-olive-dark p-9 text-ivory shadow-[0_26px_50px_-28px_rgba(58,46,40,0.55)] sm:rotate-[-0.6deg]">
      <div className="font-(family-name:--serif) text-2xl italic">
        Account Details
      </div>
      <div className="mb-4 text-xs text-ivory/50">Tap any line to copy</div>

      <CopyRow tone="dark" label="Account name" value={bankDetails.name} />
      <CopyRow tone="dark" label="Bank" value={bankDetails.bank} />
      <CopyRow tone="dark" label="Account no." value={bankDetails.account} />
      {/* <CopyRow tone="dark" label="Routing" value={bankDetails.routing} /> */}
      {bankDetails.swift && (
        <CopyRow tone="dark" label="SWIFT / BIC" value={bankDetails.swift} />
      )}

      <div className="mt-4.5 text-xs text-ivory/50">
        Please include your name as the reference, so we know who to thank
        &#9825;
      </div>
    </div>
  );
}

export default function MonetaryGift() {
  return (
    <section id="monetary-gift" className="bg-ivory pl-4 py-20 sm:py-28">
      <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-olive">
            Beyond the Registry
          </p>
          <h2 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">
            A Monetary Gift
          </h2>
          <p className="mt-4.5 max-w-md text-base text-foreground/80">
            Should you wish to gift outside of our registry, bank transfers
            toward our future together are warmly welcomed.
          </p>
        </div>

        <Suspense fallback={<MonetaryGiftSkeleton />}>
          <MonetaryGiftCard />
        </Suspense>
      </div>
    </section>
  );
}
