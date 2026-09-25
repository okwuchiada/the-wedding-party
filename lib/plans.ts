// Plan terms: on/off features plus limits. Pure, so pages, actions and the staff
// console share one set of rules. Every value is edited in the staff console.

export type PlanFeature =
  | "gallery"
  | "video"
  | "customTheme"
  | "removeBranding"
  | "customCredit"
  | "customDomain"
  | "prioritySupport";

export const FEATURE_LABELS: Record<PlanFeature, string> = {
  gallery: "Guest photo gallery",
  video: "Guests can upload videos",
  customTheme: "Custom colors and fonts",
  removeBranding: "Remove Vowly branding",
  customCredit: "Your own footer credit",
  customDomain: "Custom domain",
  prioritySupport: "Priority support",
};

/** Stored as the guest cap for plans sold as "unlimited guests". */
export const UNLIMITED_GUESTS = 100_000;

type PlanLike = { features: unknown } | null | undefined;

/** A wedding without a plan has no plan features. */
export function hasFeature(plan: PlanLike, feature: PlanFeature): boolean {
  const features = plan?.features;
  if (!features || typeof features !== "object") return false;
  return (features as Record<string, unknown>)[feature] === true;
}

export function guestLimitLabel(maxGuests: number) {
  return maxGuests >= UNLIMITED_GUESTS ? "Unlimited guests" : `Up to ${maxGuests.toLocaleString()} guests`;
}

/** An empty theme list means every theme is included. */
export function planAllowsTheme(plan: { themes: string[] } | null | undefined, presetKey: string) {
  if (!plan || plan.themes.length === 0) return true;
  return plan.themes.includes(presetKey);
}

/**
 * When the guest site closes: the plan's availability counted from the wedding
 * date. Null means it stays up (permanent plans, or no date yet).
 */
export function siteClosesAt(plan: { availabilityMonths: number | null } | null | undefined, weddingDate: Date | null | undefined) {
  if (!plan || plan.availabilityMonths === null || !weddingDate) return null;
  const closes = new Date(weddingDate);
  const day = closes.getUTCDate();
  closes.setUTCMonth(closes.getUTCMonth() + plan.availabilityMonths);
  // 31 August + 6 months is the last day of February, not early March.
  if (closes.getUTCDate() !== day) closes.setUTCDate(0);
  return closes;
}

export function siteHasClosed(plan: Parameters<typeof siteClosesAt>[0], weddingDate: Date | null | undefined, now = new Date()) {
  const closes = siteClosesAt(plan, weddingDate);
  return closes !== null && now >= closes;
}

/** How many more guest uploads the plan allows; null means no limit. */
export function uploadsLeft(plan: { maxUploads: number | null } | null | undefined, used: number) {
  if (!plan || plan.maxUploads === null) return null;
  return Math.max(0, plan.maxUploads - used);
}
