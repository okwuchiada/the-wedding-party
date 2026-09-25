import { Suspense } from "react";
import { copyText } from "@/lib/copy";
import type { TemplateKey } from "@/lib/layouts";
import { prisma } from "@/lib/prisma";
import { getWeddingById } from "@/lib/tenant";
import SectionShell, { type SectionFrame } from "./layout/section-shell";
import RegistryGrid from "./registry-grid";
import RegistrySkeleton from "./registry-skeleton";

const VARIANT: Record<TemplateKey, "card" | "row" | "bold"> = {
  classic: "card",
  editorial: "row",
  minimal: "row",
  owambe: "bold",
};

async function RegistryContent({ weddingId, template }: { weddingId: string; template: TemplateKey }) {
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
      variant={VARIANT[template]}
      bankDetails={bankDetails ?? { name: "", bank: "", account: "", routing: "", swift: null }}
    />
  );
}

export default async function Registry({ weddingId, frame }: { weddingId: string; frame: SectionFrame }) {
  const wedding = await getWeddingById(weddingId);
  return (
    <SectionShell
      id="registry"
      frame={frame}
      eyebrow="Registry"
      title="A few things we'd love"
      intro={copyText(wedding.copy, "registryIntro")}
      width={frame.template === "minimal" ? "max-w-2xl" : "max-w-5xl"}
    >
      <Suspense fallback={<RegistrySkeleton />}>
        <RegistryContent weddingId={weddingId} template={frame.template} />
      </Suspense>
    </SectionShell>
  );
}
