import { Suspense } from "react";
import { copyText } from "@/lib/copy";
import { prisma } from "@/lib/prisma";
import { getWeddingById } from "@/lib/tenant";
import RegistryGrid from "./registry-grid";
import RegistrySkeleton from "./registry-skeleton";

async function RegistryContent({ weddingId }: { weddingId: string }) {
  const [registryItems, bankDetails] = await Promise.all([
    prisma.registryItem.findMany({
      where: { weddingId },
      include: { contributions: { where: { status: "CONFIRMED" } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.bankDetails.findUnique({ where: { weddingId } }),
  ]);

  return (
    <RegistryGrid
      items={registryItems}
      bankDetails={
        bankDetails ?? { name: "", bank: "", account: "", routing: "", swift: null }
      }
    />
  );
}

export default async function Registry({ weddingId }: { weddingId: string }) {
  const wedding = await getWeddingById(weddingId);
  return (
    <section id="registry" className="bg-ivory px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-olive">
          Registry
        </p>
        <h2 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">
          A few things we&apos;d love
        </h2>
        <p className="mt-6 text-base text-foreground/80 sm:text-lg">
          {copyText(wedding.copy, "registryIntro")}
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-5xl">
        <Suspense fallback={<RegistrySkeleton />}>
          <RegistryContent weddingId={weddingId} />
        </Suspense>
      </div>
    </section>
  );
}
