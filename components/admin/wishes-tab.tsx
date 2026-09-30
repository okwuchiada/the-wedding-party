"use client";

import { useState } from "react";
import type { WishView } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { Segmented } from "@/components/ui/segmented";
import { Pagination, usePagination } from "./pagination";
import type { ReviewStatus } from "./review";
import { useActionPending } from "./use-action-pending";

const EMPTY: Record<ReviewStatus, { title: string; body: string }> = {
  PENDING: { title: "Nothing waiting for you", body: "New wishes from guests appear here for you to approve." },
  APPROVED: { title: "No approved wishes yet", body: "Wishes you approve show on your Wall of Wishes." },
  HIDDEN: { title: "Nothing hidden", body: "Hidden wishes stay here, so you can bring any back." },
};

export default function WishesTab({
  pending,
  approved,
  hidden,
  onChange,
}: {
  pending: WishView[];
  approved: WishView[];
  hidden: WishView[];
  onChange: (wish: WishView, from: ReviewStatus, to: ReviewStatus) => Promise<void>;
}) {
  const [view, setView] = useState<ReviewStatus>("PENDING");
  const { run, isPending } = useActionPending();
  const lists = { PENDING: pending, APPROVED: approved, HIDDEN: hidden };
  const paged = usePagination(lists[view], 25);

  const action = (wish: WishView, to: ReviewStatus, label: string, pendingLabel: string, variant: "primary" | "secondary") => (
    <Button
      size="sm"
      variant={variant}
      disabled={isPending(wish.id)}
      onClick={() => run(wish.id, to, () => onChange(wish, view, to))}
    >
      {isPending(wish.id, to) ? pendingLabel : label}
    </Button>
  );

  return (
    <div>
      <SectionHeading
        title="Wishes"
        description="Guests' wishes appear on your Wall of Wishes once you approve them."
        action={
          <Segmented
            label="Show"
            value={view}
            onChange={setView}
            options={[
              { value: "PENDING", label: "Pending", count: pending.length },
              { value: "APPROVED", label: "Approved", count: approved.length },
              { value: "HIDDEN", label: "Hidden", count: hidden.length },
            ]}
          />
        }
      />

      {paged.total === 0 ? (
        <EmptyState title={EMPTY[view].title} body={EMPTY[view].body} />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {paged.pageItems.map((wish) => (
              <li
                key={wish.id}
                className={`flex flex-wrap items-start justify-between gap-4 rounded-[8px] border border-line bg-surface p-4 ${view === "HIDDEN" ? "opacity-75" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-base text-ink italic">&ldquo;{wish.message}&rdquo;</p>
                  <p className="mt-2 text-[13px] text-muted">
                    {wish.guestName} &middot; {wish.dateSubmitted}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {view === "PENDING" && (
                    <>
                      {action(wish, "APPROVED", "Approve", "Approving…", "primary")}
                      {action(wish, "HIDDEN", "Hide", "Hiding…", "secondary")}
                    </>
                  )}
                  {view === "APPROVED" && action(wish, "HIDDEN", "Hide", "Hiding…", "secondary")}
                  {view === "HIDDEN" && action(wish, "APPROVED", "Restore", "Restoring…", "secondary")}
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onPageChange={paged.setPage} onPageSizeChange={paged.setPageSize} />
        </>
      )}
    </div>
  );
}
