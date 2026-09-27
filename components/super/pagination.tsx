"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PAGE_SIZE_OPTIONS, pageWindow } from "@/lib/pagination";

/**
 * A total count, page-size picker and numbered pager for one staff-console table.
 * Reads/writes the URL itself (via `prefix`), so tables on the same page (e.g. the
 * overview's weddings and activity lists) can each paginate independently without
 * disturbing each other's params, search text, or filters already on the page.
 */
export function Pagination({
  prefix = "",
  page,
  pageSize,
  total,
}: {
  prefix?: string;
  page: number;
  pageSize: number;
  total: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageKey = prefix ? `${prefix}Page` : "page";
  const sizeKey = prefix ? `${prefix}PageSize` : "pageSize";

  const hrefForPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set(pageKey, String(p));
    return `${pathname}?${params.toString()}`;
  };

  const onPageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams);
    params.set(sizeKey, e.target.value);
    params.set(pageKey, "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  if (total === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground/70">
      <p>
        Showing {from}–{to} of {total}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-1.5">
          Per page
          <select
            value={pageSize}
            onChange={onPageSizeChange}
            className="border border-(--m-mist) bg-white px-1.5 py-1 text-xs"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <nav aria-label="Pagination" className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={hrefForPage(page - 1)} className="hover:text-burnt-orange">
              Previous
            </Link>
          ) : (
            <span className="opacity-40">Previous</span>
          )}
          {pageWindow(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="text-foreground/40">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={hrefForPage(p)}
                aria-current={p === page ? "page" : undefined}
                className={p === page ? "font-semibold text-foreground" : "hover:text-burnt-orange"}
              >
                {p}
              </Link>
            )
          )}
          {page < totalPages ? (
            <Link href={hrefForPage(page + 1)} className="hover:text-burnt-orange">
              Next
            </Link>
          ) : (
            <span className="opacity-40">Next</span>
          )}
        </nav>
      </div>
    </div>
  );
}
