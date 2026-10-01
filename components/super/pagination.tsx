"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Pagination as UiPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const onPageSizeChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(sizeKey, value);
    params.set(pageKey, "1");
    router.push(`${pathname}?${params.toString()}`);
  };

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
          <span id={`${pageKey}-size`}>Per page</span>
          <Select value={String(pageSize)} onValueChange={onPageSizeChange}>
            <SelectTrigger size="sm" aria-labelledby={`${pageKey}-size`} className="gap-1 px-1.5 text-xs data-[size=sm]:h-6">
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
        <UiPagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              {page > 1 ? (
                <PaginationPrevious href={hrefForPage(page - 1)} size="xs" />
              ) : (
                <span className="px-3 opacity-40">Previous</span>
              )}
            </PaginationItem>
            {pageWindow(page, totalPages).map((p, i) =>
              p === "…" ? (
                <PaginationItem key={`gap-${i}`}>
                  <PaginationEllipsis className="size-7" />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink href={hrefForPage(p)} isActive={p === page} size="icon-xs" className="size-7 text-xs">
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              {page < totalPages ? (
                <PaginationNext href={hrefForPage(page + 1)} size="xs" />
              ) : (
                <span className="px-3 opacity-40">Next</span>
              )}
            </PaginationItem>
          </PaginationContent>
        </UiPagination>
      </div>
    </div>
  );
}
