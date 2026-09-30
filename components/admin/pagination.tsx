"use client";

import { useMemo, useState } from "react";
import { inputClass } from "@/components/ui/field";
import { PAGE_SIZE_OPTIONS, pageWindow } from "@/lib/pagination";

/**
 * Client-side paging over an already-loaded array (these tabs load a wedding's
 * full RSVP/contribution/registry list once, then filter and edit it in place).
 * Resets to page 1 whenever the list's length changes, e.g. after adding or
 * deleting a row, so the view never gets stuck on a now-empty trailing page.
 */
export function usePagination<T>(items: T[], initialPageSize: (typeof PAGE_SIZE_OPTIONS)[number] = 25) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page1 = Math.min(page, totalPages);
  const pageItems = useMemo(() => items.slice((page1 - 1) * pageSize, page1 * pageSize), [items, page1, pageSize]);

  return {
    page: page1,
    pageSize,
    totalPages,
    pageItems,
    total: items.length,
    setPage,
    setPageSize: (n: (typeof PAGE_SIZE_OPTIONS)[number]) => {
      setPageSize(n);
      setPage(1);
    },
  };
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: (typeof PAGE_SIZE_OPTIONS)[number]) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  if (total === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted">
      <p>
        Showing {from}–{to} of {total}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-1.5">
          Per page
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])}
            aria-label="Rows per page"
            className={`${inputClass} w-auto py-1.5 text-[13px]`}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="min-h-9 min-w-9 rounded-full px-2 text-[13px] hover:bg-surface-muted aria-[current=page]:bg-ink aria-[current=page]:text-paper disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Previous
          </button>
          {pageWindow(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-muted">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-current={p === page ? "page" : undefined}
                onClick={() => onPageChange(p)}
                className="min-h-9 min-w-9 rounded-full px-2 text-[13px] hover:bg-surface-muted aria-[current=page]:bg-ink aria-[current=page]:text-paper disabled:opacity-40 disabled:hover:bg-transparent"
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="min-h-9 min-w-9 rounded-full px-2 text-[13px] hover:bg-surface-muted aria-[current=page]:bg-ink aria-[current=page]:text-paper disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  );
}
