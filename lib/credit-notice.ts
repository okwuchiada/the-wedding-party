/**
 * What the Wording tab tells a couple whose plan doesn't allow their own footer
 * credit, naming the plans that do (read from the database, so renames show up).
 */
export function creditUpgradeNotice({
  brandingRemoved,
  brandingPlan,
  creditPlan,
}: {
  /** Their plan already hides Vowly's credit. */
  brandingRemoved: boolean;
  /** Cheapest plan that removes Vowly's credit. */
  brandingPlan: string | null;
  /** Cheapest plan that allows a credit of their own. */
  creditPlan: string | null;
}) {
  if (brandingRemoved) {
    const base = "Your plan leaves the footer credit off.";
    return creditPlan ? `${base} Upgrade to ${creditPlan} to credit someone of your choice.` : base;
  }
  const base = "Your plan shows “Made with love by Vowly”.";
  if (brandingPlan && creditPlan && brandingPlan === creditPlan) {
    return `${base} Upgrade to ${brandingPlan} to remove it or credit someone of your choice.`;
  }
  if (brandingPlan && creditPlan) {
    return `${base} Upgrade to ${brandingPlan} to remove it, or to ${creditPlan} to credit someone of your choice.`;
  }
  if (brandingPlan) return `${base} Upgrade to ${brandingPlan} to remove it.`;
  if (creditPlan) return `${base} Upgrade to ${creditPlan} to credit someone of your choice.`;
  return base;
}
