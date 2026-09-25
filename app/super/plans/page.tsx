import PlanForm from "@/components/super/plan-form";
import { requirePermission } from "@/lib/dal";
import type { PlanFeature } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export default async function SuperPlansPage() {
  await requirePermission("plans.manage");
  const plans = await prisma.plan.findMany({
    orderBy: [{ sortOrder: "asc" }, { priceKobo: "asc" }],
    include: { _count: { select: { weddings: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-foreground/70">
        Plans are one-time payments per wedding, charged in naira. Turn off &ldquo;On sale&rdquo; to retire a plan;
        weddings already on it keep it.
      </p>
      {plans.map((plan) => (
        <PlanForm
          key={plan.id}
          plan={{
            id: plan.id,
            key: plan.key,
            name: plan.name,
            priceKobo: plan.priceKobo,
            maxGuests: plan.maxGuests,
            sortOrder: plan.sortOrder,
            active: plan.active,
            features: plan.features as Partial<Record<PlanFeature, boolean>>,
            weddingCount: plan._count.weddings,
          }}
        />
      ))}
      <h2 className="mt-4 font-(family-name:--m-display) font-bold tracking-tight text-2xl">New plan</h2>
      <PlanForm />
    </div>
  );
}
