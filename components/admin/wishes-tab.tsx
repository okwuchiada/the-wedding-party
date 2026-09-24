"use client";

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
      <h2 className="mb-5 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">Pending Wishes</h2>

      {pending.length === 0 ? (
        <p className="text-sm text-foreground/60">No pending wishes right now.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map((wish) => (
            <div key={wish.id} className="flex items-start justify-between gap-4 rounded-[6px] bg-white p-4 border border-(--m-mist)">
              <div>
                <p className="text-base text-foreground italic">&ldquo;{wish.message}&rdquo;</p>
                <p className="mt-2 text-xs text-foreground/60">
                  {wish.guestName} &middot; {wish.dateSubmitted}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={isPending(wish.id)}
                  onClick={() => run(wish.id, "approve", () => onApprove(wish))}
                  className="rounded-full bg-(--m-gold) px-3 py-1.5 text-xs font-semibold text-(--m-ink) hover:bg-(--m-ink) hover:text-(--m-paper) disabled:opacity-60"
                >
                  {isPending(wish.id, "approve") ? "Approving…" : "Approve"}
                </button>
                <button
                  type="button"
                  disabled={isPending(wish.id)}
                  onClick={() => run(wish.id, "hide", () => onHide(wish))}
                  className="border rounded-full border-(--m-ink)/25 px-3 py-1.5 text-xs font-medium text-foreground hover:border-(--m-ink) disabled:opacity-60"
                >
                  {isPending(wish.id, "hide") ? "Hiding…" : "Hide"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 mb-5 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">Approved Wishes</h2>

      {approved.length === 0 ? (
        <p className="text-sm text-foreground/60">Nothing approved yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {approved.map((wish) => (
            <div key={wish.id} className="rounded-[6px] bg-white p-4 border border-(--m-mist)">
              <p className="text-base text-foreground italic">&ldquo;{wish.message}&rdquo;</p>
              <p className="mt-2 text-xs text-foreground/60">— {wish.guestName}</p>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 mb-5 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">Hidden Wishes</h2>
      <p className="mb-5 max-w-2xl text-sm text-foreground/60">
        Hidden wishes aren&apos;t deleted — they&apos;re kept here so you can bring
        any of them back if you change your mind.
      </p>

      {hidden.length === 0 ? (
        <p className="text-sm text-foreground/60">Nothing hidden right now.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {hidden.map((wish) => (
            <div key={wish.id} className="flex items-start justify-between gap-4 rounded-[6px] bg-white p-4 opacity-70 border border-(--m-mist)">
              <div>
                <p className="text-base text-foreground italic">&ldquo;{wish.message}&rdquo;</p>
                <p className="mt-2 text-xs text-foreground/60">
                  {wish.guestName} &middot; {wish.dateSubmitted}
                </p>
              </div>
              <button
                type="button"
                disabled={isPending(wish.id)}
                onClick={() => run(wish.id, "restore", () => onRestore(wish))}
                className="shrink-0 border rounded-full border-(--m-ink)/25 px-3 py-1.5 text-xs font-medium text-foreground hover:border-(--m-ink) disabled:opacity-60"
              >
                {isPending(wish.id, "restore") ? "Restoring…" : "Restore"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
