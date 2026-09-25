import Link from "next/link";
import MarketingShell from "@/components/marketing/shell";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <MarketingShell>
      <section className="mx-auto flex max-w-xl flex-col items-start gap-4 px-5 py-24 sm:px-8">
        <h1 className="font-(family-name:--m-display) text-4xl font-extrabold tracking-[-0.03em]">We can&apos;t find that page</h1>
        <p className="text-lg text-(--m-ink)/75">The link may be old or mistyped.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className={buttonClass("primary", "lg")}>Go to your dashboard</Link>
          <Link href="/" className={buttonClass("secondary", "lg")}>Home</Link>
        </div>
      </section>
    </MarketingShell>
  );
}
