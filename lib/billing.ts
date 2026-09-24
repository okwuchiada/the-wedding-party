// Pure pricing rules for one-time wedding plans (Paystack amounts are in kobo).

/** Paystack rejects charges below ₦100. */
export const MIN_CHARGE_KOBO = 100_00;

type PlanTerms = { priceKobo: number; maxGuests: number; features: unknown };
type PlanPrice = PlanTerms & { id: string; active: boolean };

function enabledFeatures(plan: PlanTerms) {
  const features = plan.features && typeof plan.features === "object" ? plan.features : {};
  return Object.entries(features).filter(([, on]) => on === true).map(([name]) => name);
}

/** Costs more and actually adds something: more guests or a feature the current plan lacks. */
function isUpgrade(target: PlanTerms, current: PlanTerms) {
  if (target.priceKobo <= current.priceKobo) return false;
  const have = new Set(enabledFeatures(current));
  return target.maxGuests > current.maxGuests || enabledFeatures(target).some((f) => !have.has(f));
}

/**
 * What a wedding owes to move onto `target`: its price minus everything the
 * wedding has already paid, so upgrades cost the difference. Null when the
 * plan can't be chosen (inactive, or not an upgrade).
 */
export function upgradeCharge(target: PlanPrice, current: PlanTerms | null, paidKobo: number) {
  if (!target.active) return null;
  if (current && !isUpgrade(target, current)) return null;
  return Math.max(0, target.priceKobo - paidKobo);
}

/** A charge Paystack reports must match what we asked for, exactly. */
export function paymentMatches(
  expected: { reference: string; amountKobo: number; currency: string },
  reported: { reference?: unknown; amount?: unknown; currency?: unknown; status?: unknown }
) {
  return (
    reported.status === "success" &&
    reported.reference === expected.reference &&
    reported.amount === expected.amountKobo &&
    reported.currency === expected.currency
  );
}
