/** How many items a guest wall page loads at a time, and per "Load more". */
export const SHOWN_STEP = 24;
export const MAX_SHOWN = 500;

/** The ?shown= count for a guest wall page, clamped to something sensible. */
export function shownParam(raw: string | string[] | undefined) {
  const n = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < SHOWN_STEP) return SHOWN_STEP;
  return Math.min(n, MAX_SHOWN);
}

/** Whether a "Load more" link would actually show anything new. */
export function canLoadMore(total: number, shown: number) {
  return total > shown && shown < MAX_SHOWN;
}
