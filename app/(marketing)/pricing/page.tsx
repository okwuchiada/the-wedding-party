import type { Metadata } from "next";
import Pricing from "@/components/marketing/pricing";

export const metadata: Metadata = { title: "Pricing — The Wedding Party" };

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-10 pb-24 sm:px-8">
      <h1 className="max-w-2xl font-(family-name:--m-display) text-5xl leading-none font-extrabold tracking-[-0.03em] sm:text-6xl">
        One payment per wedding
      </h1>
      <p className="mt-5 max-w-xl text-lg text-(--m-ink)/75">
        No subscription. Build and preview your site for free, and pay when you publish it for guests. Upgrade later and you only pay the difference.
      </p>
      <div className="mt-12">
        <Pricing />
      </div>
    </section>
  );
}
