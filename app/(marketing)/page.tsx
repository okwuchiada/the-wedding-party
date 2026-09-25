import { Camera, HeartHandshake, Link2, PenLine } from "lucide-react";
import Link from "next/link";
import FeatureShowcase from "@/components/marketing/feature-showcase";
import Pricing from "@/components/marketing/pricing";
import ThemeShowcase from "@/components/marketing/theme-showcase";

const STEPS = [
  {
    icon: PenLine,
    title: "Make your site",
    text: "Add your names and date, pick your colours, and tell your story. It stays private until you publish.",
  },
  {
    icon: Link2,
    title: "Share one link",
    text: "Send it on WhatsApp, print it on the IV. Guests open it on their phones; no app, no account.",
  },
  {
    icon: HeartHandshake,
    title: "Guests RSVP and give",
    text: "You see every RSVP as it comes in. Guests chip in toward gifts by bank transfer, and you confirm when the money lands.",
  },
  {
    icon: Camera,
    title: "Collect the day",
    text: "On the day, open the gallery wall. Guests post photos and videos; you choose what everyone sees.",
  },
];

const FAQS = [
  { q: "Do our guests need to sign up?", a: "No. They open your link and use the site straight away." },
  {
    q: "How do gifts work? Do you hold our money?",
    a: "We never touch it. Guests see your account details, send a transfer from their own bank, and tell you what it's for. You mark it received when it arrives, and the registry updates.",
  },
  { q: "Is it a subscription?", a: "No. Start on the free plan, and if you want more, upgrade once per wedding. Upgrading later costs only the difference." },
  {
    q: "Can we keep it private?",
    a: "Until you publish, only you can see it. After that, anyone with the link can visit. You can also limit it to certain countries and give an access code to guests abroad.",
  },
  { q: "Can my partner help?", a: "Yes. Invite them by email and you can both manage the site, RSVPs and gifts." },
];

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-10 pb-20 sm:px-8 sm:pt-14">
        <ThemeShowcase>
          <h1 className="font-(family-name:--m-display) text-5xl leading-[0.95] font-extrabold tracking-[-0.03em] sm:text-7xl">
            One link for your whole wedding.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-(--m-ink)/75">
            RSVPs, a registry your guests can chip into, and a photo wall for the day, on a site dressed in your colours.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-full bg-(--m-gold) px-6 py-3.5 text-sm font-semibold text-(--m-ink) hover:bg-(--m-ink) hover:text-(--m-paper)">
              Create your site for free
            </Link>
            <Link href="/pricing" className="rounded-full border border-(--m-ink)/25 px-6 py-3.5 text-sm font-semibold hover:border-(--m-ink)">
              See pricing
            </Link>
          </div>
          <p className="mt-4 text-sm text-(--m-ink)/60">Start free, no card required, and publish whenever you&apos;re ready.</p>
        </ThemeShowcase>
      </section>

      <section className="bg-(--m-ink) text-(--m-paper)">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <h2 className="max-w-xl font-(family-name:--m-display) text-4xl font-bold tracking-tight sm:text-5xl">
            From engagement to the last dance
          </h2>
          <ol className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <div className="flex items-center gap-3">
                  <span className="font-(family-name:--m-display) text-5xl font-extrabold text-(--m-gold)">{i + 1}</span>
                  <step.icon aria-hidden className="h-5 w-5 text-(--m-paper)/40" />
                </div>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-(--m-paper)/75">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <FeatureShowcase />

      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-8 px-5 py-20 sm:px-8">
        <h2 className="font-(family-name:--m-display) text-4xl font-bold tracking-tight sm:text-5xl">Start free, pay once if you upgrade</h2>
        <p className="mt-4 max-w-xl text-lg text-(--m-ink)/75">
          Publish on the free plan, or upgrade for every theme, your own colours and a bigger gallery.
        </p>
        <div className="mt-10">
          <Pricing />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        <h2 className="font-(family-name:--m-display) text-3xl font-bold tracking-tight">Questions couples ask</h2>
        <div className="mt-6 divide-y divide-(--m-mist) border-y border-(--m-mist)">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                {faq.q}
                <span aria-hidden className="text-2xl leading-none text-(--m-emerald) transition-transform group-open:rotate-45 motion-reduce:transition-none">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-prose leading-relaxed text-(--m-ink)/75">{faq.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/signup" className="rounded-full bg-(--m-gold) px-6 py-3.5 text-sm font-semibold hover:bg-(--m-ink) hover:text-(--m-paper)">
            Create your site for free
          </Link>
          <Link href="/pricing" className="text-sm font-semibold text-(--m-ink)/70 underline decoration-(--m-ink)/25 underline-offset-4 hover:text-(--m-ink)">
            Compare plans
          </Link>
        </div>
        <p className="mt-4 text-sm text-(--m-ink)/60">Start free, no card required, and publish whenever you&apos;re ready.</p>
      </section>
    </>
  );
}
