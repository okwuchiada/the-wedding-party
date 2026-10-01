"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-ink/70">
      <p>
        Showing {from}–{to} of {total}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span>Per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v) as (typeof PAGE_SIZE_OPTIONS)[number])}>
            <SelectTrigger size="sm" aria-label="Per page" className="gap-1 px-1.5 text-xs data-[size=sm]:h-6">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)} className="text-xs">
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="xs" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="font-medium disabled:opacity-40">
            Previous
          </Button>
          {pageWindow(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-ink/40">
                …
              </span>
            ) : (
              <Button
                key={p}
                type="button"
                variant={p === page ? "outline" : "ghost"}
                size="icon-xs"
                aria-current={p === page ? "page" : undefined}
                onClick={() => onPageChange(p)}
                className="size-7 text-xs"
              >
                {p}
              </Button>
            )
          )}
          <Button type="button" variant="ghost" size="xs" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="font-medium disabled:opacity-40">
            Next
          </Button>
        </nav>
      </div>
    </div>
  );
}
