import type { Metadata } from "next";
import Faq, { PRICING_FAQS } from "@/components/marketing/faq";
import Pricing from "@/components/marketing/pricing";
import { formatMoney } from "@/lib/money";
import { upgradeExample } from "@/lib/pricing-example";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Pricing — Vowly" };

const NAIRA = { currency: "NGN", locale: "en-NG" };

export default async function PricingPage() {
  const example = upgradeExample(await prisma.plan.findMany({ where: { active: true } }));

  return (
    <section className="mx-auto max-w-6xl px-5 pt-10 pb-24 sm:px-8">
      <h1 className="max-w-2xl font-(family-name:--m-display) text-5xl leading-none font-extrabold tracking-[-0.03em] sm:text-6xl">
        Start free, pay once if you upgrade
      </h1>
      <p className="mt-5 max-w-xl text-lg text-(--m-ink)/75">
        No subscription. Start free and publish when you&apos;re ready. Upgrade once per wedding, and if you upgrade again later you only pay the difference.
      </p>

      {example && (
        <ol aria-label="How upgrading works" className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <li className="rounded-[8px] border border-(--m-mist) bg-white p-5">
            <p className="text-sm text-(--m-ink)/65">First, you buy</p>
            <p className="mt-1 font-(family-name:--m-display) text-2xl font-bold">{example.first}</p>
            <p className="tabular-nums">{formatMoney(example.firstKobo, NAIRA)}</p>
          </li>
          <li className="rounded-[8px] border border-(--m-mist) bg-white p-5">
            <p className="text-sm text-(--m-ink)/65">Later, you want</p>
            <p className="mt-1 font-(family-name:--m-display) text-2xl font-bold">{example.second}</p>
            <p className="tabular-nums">{formatMoney(example.secondKobo, NAIRA)}</p>
          </li>
          <li className="rounded-[8px] border border-(--m-gold) bg-(--m-gold)/15 p-5">
            <p className="text-sm text-(--m-ink)/65">You pay only</p>
            <p className="mt-1 font-(family-name:--m-display) text-2xl font-bold tabular-nums">{formatMoney(example.chargeKobo, NAIRA)}</p>
            <p>the difference, once</p>
          </li>
        </ol>
      )}

      <div className="mt-12">
        <Pricing />
      </div>

      <div className="mt-20 max-w-3xl">
        <h2 className="font-(family-name:--m-display) text-3xl font-bold tracking-tight">Questions about paying</h2>
        <div className="mt-6">
          <Faq items={PRICING_FAQS} />
        </div>
      </div>
    </section>
  );
}
