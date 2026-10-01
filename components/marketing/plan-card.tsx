import { Check, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

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
  const muted = dark ? "text-paper/70" : "text-ink/60";

  return (
    <Card
      role="region"
      aria-label={plan.name}
      className={cn(
        "relative gap-0 rounded-md p-7 shadow-none",
        dark ? "border-transparent bg-ink text-paper" : "bg-white text-ink",
        current && "ring-3 ring-gold ring-offset-2"
      )}
    >
      {plan.popular && (
        <Badge variant="gold" className="absolute -top-3 left-7 px-3 py-1">
          Most popular
        </Badge>
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
            <Check aria-hidden size={18} className={`mt-0.5 shrink-0 ${dark ? "text-gold" : "text-emerald"}`} />
            {item}
          </li>
        ))}
      </ul>
      {plan.limitations.length > 0 && (
        <ul
          aria-label="Limits"
          className={`mt-6 flex flex-col gap-2 border-t pt-5 text-sm ${muted} ${dark ? "border-paper/15" : "border-mist"}`}
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
    </Card>
  );
}
