import Link from "next/link";
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
            <Link
              href="/signup"
              className={`block rounded-full px-5 py-3 text-center text-sm font-semibold ${
                plan.popular ? "bg-(--m-gold) text-(--m-ink) hover:bg-(--m-paper)" : "bg-(--m-ink) text-(--m-paper) hover:bg-(--m-emerald)"
              }`}
            >
              {plan.priceKobo === 0 ? "Start for free" : `Start with ${plan.name}`}
            </Link>
          }
        />
      ))}
    </div>
  );
}
