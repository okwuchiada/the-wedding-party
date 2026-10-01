import { upgradeCharge } from "@/lib/billing";

type Plan = { id: string; name: string; priceKobo: number; maxGuests: number; features: unknown; active: boolean };

/**
 * A worked "pay once, upgrade for the difference" example from the two cheapest
 * paid plans, using the same rule checkout does. Null when there's no real upgrade to show.
 */
export function upgradeExample(plans: Plan[]) {
  const [first, second] = plans.filter((p) => p.active && p.priceKobo > 0).sort((a, b) => a.priceKobo - b.priceKobo);
  if (!first || !second) return null;
  const chargeKobo = upgradeCharge(second, first, first.priceKobo);
  if (chargeKobo === null) return null;
  return { first: first.name, firstKobo: first.priceKobo, second: second.name, secondKobo: second.priceKobo, chargeKobo };
}
