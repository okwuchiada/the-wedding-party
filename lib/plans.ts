export type PlanFeature = "gallery" | "customTheme" | "removeBranding";

type PlanLike = { features: unknown } | null | undefined;

/** A wedding without a plan (an unpaid draft) has no paid features. */
export function hasFeature(plan: PlanLike, feature: PlanFeature): boolean {
  const features = plan?.features;
  if (!features || typeof features !== "object") return false;
  return (features as Record<string, unknown>)[feature] === true;
}

export const FEATURE_LABELS: Record<PlanFeature, string> = {
  gallery: "Guest photo & video gallery",
  customTheme: "Custom colors and fonts",
  removeBranding: "Your own footer credit",
};
