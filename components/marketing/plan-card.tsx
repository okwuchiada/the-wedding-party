import { Check, Minus } from "lucide-react";
import { formatMoney } from "@/lib/money";

const NAIRA = { currency: "NGN", locale: "en-NG" };

export type PlanCardPlan = {
  name: string;
  tagline: string | null;
  priceKobo: number;
  popular: boolean;
  highlights: string[];
  limitations: string[];
};

/** One plan as the pricing page and Billing show it; `action` is the button (or note) at the bottom. */
export default function PlanCard({
  plan,
  action,
  current = false,
}: {
  plan: PlanCardPlan;
  action: React.ReactNode;
  /** Outline it as the wedding's current plan. */
  current?: boolean;
}) {
  const dark = plan.popular;
  const muted = dark ? "text-(--m-paper)/70" : "text-(--m-ink)/60";

  return (
    <section
      aria-label={plan.name}
      className={`relative flex flex-col rounded-[6px] p-7 ${
        dark ? "bg-(--m-ink) text-(--m-paper)" : "border border-(--m-mist) bg-white text-(--m-ink)"
      } ${current ? "ring-3 ring-(--m-gold) ring-offset-2" : ""}`}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-7 rounded-full bg-(--m-gold) px-3 py-1 text-xs font-bold text-(--m-ink)">Most popular</span>
      )}
      <h3 className="font-(family-name:--m-display) text-2xl font-bold">{plan.name}</h3>
      {plan.tagline && <p className={`mt-1.5 text-sm ${muted}`}>{plan.tagline}</p>}
      <p className="mt-5 font-(family-name:--m-display) text-4xl font-extrabold tracking-tight">
        {plan.priceKobo === 0 ? "Free" : formatMoney(plan.priceKobo, NAIRA)}
      </p>
      <p className={`mt-1 text-sm ${muted}`}>{plan.priceKobo === 0 ? "no card needed" : "once, for your wedding"}</p>

      <ul className="mt-6 flex flex-col gap-2.5 text-[15px]">
        {plan.highlights.map((item) => (
          <li key={item} className="flex gap-2.5">
            <Check aria-hidden size={18} className={`mt-0.5 shrink-0 ${dark ? "text-(--m-gold)" : "text-(--m-emerald)"}`} />
            {item}
          </li>
        ))}
      </ul>
      {plan.limitations.length > 0 && (
        <ul
          aria-label="Limits"
          className={`mt-6 flex flex-col gap-2 border-t pt-5 text-sm ${muted} ${dark ? "border-(--m-paper)/15" : "border-(--m-mist)"}`}
        >
          {plan.limitations.map((item) => (
            <li key={item} className="flex gap-2.5">
              <Minus aria-hidden size={16} className="mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto pt-8">{action}</div>
    </section>
  );
}
