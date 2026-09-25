import PlansList from "@/components/super/plans-list";
import { requirePermission } from "@/lib/dal";
import type { PlanFeature } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { THEME_PRESETS } from "@/lib/themes";

const themes = THEME_PRESETS.map((t) => ({ key: t.key, name: t.name }));

export default async function SuperPlansPage() {
  await requirePermission("plans.manage");
  const plans = await prisma.plan.findMany({
    orderBy: [{ sortOrder: "asc" }, { priceKobo: "asc" }],
    include: { _count: { select: { weddings: true } } },
  });

  return (
    <PlansList
      themes={themes}
      plans={plans.map((plan) => ({
        id: plan.id,
        key: plan.key,
        name: plan.name,
        tagline: plan.tagline,
        priceKobo: plan.priceKobo,
        maxGuests: plan.maxGuests,
        maxUploads: plan.maxUploads,
        availabilityMonths: plan.availabilityMonths,
        themes: plan.themes,
        sortOrder: plan.sortOrder,
        active: plan.active,
        popular: plan.popular,
        highlights: plan.highlights,
        limitations: plan.limitations,
        features: plan.features as Partial<Record<PlanFeature, boolean>>,
        weddingCount: plan._count.weddings,
      }))}
    />
  );
}
