import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { FEATURE_LABELS, hasFeature, type PlanFeature } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

const NAIRA = { currency: "NGN", locale: "en-NG" };

export default async function Pricing() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { priceKobo: "asc" }],
  });
  if (plans.length === 0) return null;
  const allFeatures = Object.keys(FEATURE_LABELS) as PlanFeature[];

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
      {plans.map((plan, i) => {
        const featured = i === plans.length - 1 && plans.length > 1;
        return (
          <section
            key={plan.id}
            aria-label={plan.name}
            className={`flex flex-col rounded-[6px] p-7 ${
              featured ? "bg-(--m-ink) text-(--m-paper)" : "border border-(--m-mist) bg-white"
            }`}
          >
            <h3 className="font-(family-name:--m-display) text-2xl font-bold">{plan.name}</h3>
            <p className="mt-4 font-(family-name:--m-display) text-4xl font-extrabold tracking-tight">
              {formatMoney(plan.priceKobo, NAIRA)}
            </p>
            <p className={`mt-1 text-sm ${featured ? "text-(--m-paper)/70" : "text-(--m-ink)/60"}`}>once, for your wedding</p>
            <ul className="mt-6 flex flex-col gap-2.5 text-[15px]">
              <li>Up to {plan.maxGuests.toLocaleString()} guests</li>
              <li>RSVPs, gift registry and wishes</li>
              {allFeatures.map((f) => (
                <li key={f} className={hasFeature(plan, f) ? "" : "line-through opacity-45"}>
                  {FEATURE_LABELS[f]}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={`mt-8 rounded-full px-5 py-3 text-center text-sm font-semibold ${
                featured ? "bg-(--m-gold) text-(--m-ink) hover:bg-(--m-paper)" : "bg-(--m-ink) text-(--m-paper) hover:bg-(--m-emerald)"
              }`}
            >
              Start with {plan.name}
            </Link>
          </section>
        );
      })}
    </div>
  );
}
