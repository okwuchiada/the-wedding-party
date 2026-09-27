/** Shared page-size choices for every paginated staff console table. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export function readPage(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function readPageSize(value: string | undefined, fallback: PageSize): PageSize {
  const n = Number(value);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n) ? (n as PageSize) : fallback;
}

/** Reads `<prefix>Page`/`<prefix>PageSize` (or bare `page`/`pageSize` with no prefix) and returns Prisma's skip/take. */
export function readPagination(
  sp: Record<string, string | undefined>,
  { prefix = "", defaultPageSize = 25 as PageSize }: { prefix?: string; defaultPageSize?: PageSize } = {}
) {
  const pageKey = prefix ? `${prefix}Page` : "page";
  const sizeKey = prefix ? `${prefix}PageSize` : "pageSize";
  const page = readPage(sp[pageKey]);
  const pageSize = readPageSize(sp[sizeKey], defaultPageSize);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

/** A windowed list of page numbers around `current`, with "…" gaps, for a numbered pager. */
export function pageWindow(current: number, totalPages: number, radius = 1): (number | "…")[] {
  if (totalPages <= 1) return [1];
  const keep = new Set<number>([1, totalPages, current]);
  for (let d = 1; d <= radius; d++) {
    keep.add(current - d);
    keep.add(current + d);
  }
  const sorted = [...keep].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}
