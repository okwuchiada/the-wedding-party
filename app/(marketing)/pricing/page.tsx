import type { Metadata } from "next";
import Pricing from "@/components/marketing/pricing";

export const metadata: Metadata = { title: "Pricing — Vowly" };

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-10 pb-24 sm:px-8">
      <h1 className="max-w-2xl font-(family-name:--m-display) text-5xl leading-none font-extrabold tracking-[-0.03em] sm:text-6xl">
        Start free, pay once if you upgrade
      </h1>
      <p className="mt-5 max-w-xl text-lg text-(--m-ink)/75">
        No subscription. Start free and publish when you&apos;re ready. Upgrade once per wedding, and if you upgrade again later you only pay the difference.
      </p>
      <div className="mt-12">
        <Pricing />
      </div>
    </section>
  );
}
