export type PlanFeature = "gallery" | "customTheme" | "removeBranding";

type PlanLike = { features: unknown } | null | undefined;

/** A wedding without a plan (an unpaid draft) has no paid features. */
export function hasFeature(plan: PlanLike, feature: PlanFeature): boolean {
  const features = plan?.features;
  if (!features || typeof features !== "object") return false;
  return (features as Record<string, unknown>)[feature] === true;
}
