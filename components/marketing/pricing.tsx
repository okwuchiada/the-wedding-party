import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import PlanCard from "./plan-card";

export default async function Pricing() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { priceKobo: "asc" }],
  });
  if (plans.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-5 pt-3 md:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          action={
            <Button asChild variant={plan.popular ? "default" : "ink"} className={`w-full py-3 ${plan.popular ? "hover:bg-paper hover:text-ink" : ""}`}>
              <Link href="/signup">{plan.priceKobo === 0 ? "Start for free" : `Start with ${plan.name}`}</Link>
            </Button>
          }
        />
      ))}
    </div>
  );
}
