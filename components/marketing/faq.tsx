export type FaqItem = { q: string; a: string };

export const LANDING_FAQS: FaqItem[] = [
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

export const PRICING_FAQS: FaqItem[] = [
  ...LANDING_FAQS.filter((f) => /subscription|money|private/i.test(f.q)),
  {
    q: "What happens after the wedding?",
    a: "Your site stays online for the time your plan includes, then shows guests a thank-you page. Upgrading later keeps it up longer.",
  },
];

/** Questions as open/close rows; each opens with Enter or Space like any disclosure. */
export default function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-(--m-mist) border-y border-(--m-mist)">
      {items.map((faq) => (
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
  );
}
