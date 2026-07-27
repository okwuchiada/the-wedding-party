import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import RegistryGrid from "./registry-grid";
import RegistrySkeleton from "./registry-skeleton";

async function RegistryContent() {
  const [registryItems, bankDetails] = await Promise.all([
    prisma.registryItem.findMany({
      include: { contributions: { where: { status: "CONFIRMED" } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.bankDetails.findUnique({ where: { id: "main" } }),
  ]);

  return (
    <RegistryGrid
      items={registryItems}
      bankDetails={
        bankDetails ?? { name: "", bank: "", account: "", routing: "" }
      }
    />
  );
}

export default function Registry() {
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
          Your presence at our wedding is the greatest gift of all. If you wish
          to celebrate with us further, we&apos;ve put together a small list of
          things we&apos;d love for our new home together. Chip in to a group
          gift, buy online, or bring something to the celebration.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-5xl">
        <Suspense fallback={<RegistrySkeleton />}>
          <RegistryContent />
        </Suspense>
      </div>
    </section>
  );
}
