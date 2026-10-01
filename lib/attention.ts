// What's waiting for the couple on their dashboard, and what's newly arrived. Pure.

type Counts = { contributions: number; media: number; wishes: number };

const WORDING: { tab: keyof Counts; one: string; many: string }[] = [
  { tab: "contributions", one: "transfer to confirm", many: "transfers to confirm" },
  { tab: "media", one: "photo or video to review", many: "photos and videos to review" },
  { tab: "wishes", one: "wish to review", many: "wishes to review" },
];

/** One item per tab with something waiting, in tab order; empty when the couple is caught up. */
export function attentionItems(counts: Counts) {
  return WORDING.filter((w) => counts[w.tab] > 0).map((w) => ({
    tab: w.tab,
    count: counts[w.tab],
    label: `${counts[w.tab]} ${counts[w.tab] === 1 ? w.one : w.many}`,
  }));
}

/** Items whose id hasn't been seen yet, in their current order. */
export function newArrivals<T extends { id: string }>(seen: ReadonlySet<string>, items: T[]) {
  return items.filter((item) => !seen.has(item.id));
}
