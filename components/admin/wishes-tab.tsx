"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ApprovedWishView, HiddenWishView, PendingWishView } from "@/lib/types";
import { useActionPending } from "./use-action-pending";

export default function WishesTab({
  pending,
  approved,
  hidden,
  onApprove,
  onHide,
  onRestore,
}: {
  pending: PendingWishView[];
  approved: ApprovedWishView[];
  hidden: HiddenWishView[];
  onApprove: (wish: PendingWishView) => Promise<void>;
  onHide: (wish: PendingWishView) => Promise<void>;
  onRestore: (wish: HiddenWishView) => Promise<void>;
}) {
  const { run, isPending } = useActionPending();

  return (
    <div>
      <h2 className="mb-5 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-ink">Pending Wishes</h2>

      {pending.length === 0 ? (
        <p className="text-sm text-ink/60">No pending wishes right now.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map((wish) => (
            <Card key={wish.id} className="flex-row items-start justify-between gap-4 rounded-md p-4 shadow-none">
              <div>
                <p className="text-base text-ink italic">&ldquo;{wish.message}&rdquo;</p>
                <p className="mt-2 text-xs text-ink/60">
                  {wish.guestName} &middot; {wish.dateSubmitted}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button type="button" size="xs" disabled={isPending(wish.id)} onClick={() => run(wish.id, "approve", () => onApprove(wish))}>
                  {isPending(wish.id, "approve") ? "Approving…" : "Approve"}
                </Button>
                <Button type="button" variant="outline" size="xs" disabled={isPending(wish.id)} onClick={() => run(wish.id, "hide", () => onHide(wish))}>
                  {isPending(wish.id, "hide") ? "Hiding…" : "Hide"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mt-10 mb-5 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-ink">Approved Wishes</h2>

      {approved.length === 0 ? (
        <p className="text-sm text-ink/60">Nothing approved yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {approved.map((wish) => (
            <Card key={wish.id} className="gap-0 rounded-md p-4 shadow-none">
              <p className="text-base text-ink italic">&ldquo;{wish.message}&rdquo;</p>
              <p className="mt-2 text-xs text-ink/60">— {wish.guestName}</p>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mt-10 mb-5 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-ink">Hidden Wishes</h2>
      <p className="mb-5 max-w-2xl text-sm text-ink/60">
        Hidden wishes aren&apos;t deleted — they&apos;re kept here so you can bring
        any of them back if you change your mind.
      </p>

      {hidden.length === 0 ? (
        <p className="text-sm text-ink/60">Nothing hidden right now.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {hidden.map((wish) => (
            <Card key={wish.id} className="flex-row items-start justify-between gap-4 rounded-md p-4 opacity-70 shadow-none">
              <div>
                <p className="text-base text-ink italic">&ldquo;{wish.message}&rdquo;</p>
                <p className="mt-2 text-xs text-ink/60">
                  {wish.guestName} &middot; {wish.dateSubmitted}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={isPending(wish.id)}
                onClick={() => run(wish.id, "restore", () => onRestore(wish))}
                className="shrink-0"
              >
                {isPending(wish.id, "restore") ? "Restoring…" : "Restore"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
