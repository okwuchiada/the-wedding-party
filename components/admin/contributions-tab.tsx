"use client";

import type { ConfirmedContributionView, PendingContributionView } from "@/lib/types";
import { useActionPending } from "./use-action-pending";

function formatNaira(cents: number) {
  return `₦${(cents / 100).toLocaleString("en-NG")}`;
}

export default function ContributionsTab({
  pending,
  confirmed,
  onConfirm,
}: {
  pending: PendingContributionView[];
  confirmed: ConfirmedContributionView[];
  onConfirm: (contribution: PendingContributionView) => Promise<void>;
}) {
  const { run, isPending } = useActionPending();

  return (
    <div>
      <h2 className="mb-5 font-(family-name:--serif) text-2xl text-foreground">Pending Contributions</h2>

      {pending.length === 0 ? (
        <p className="text-sm text-foreground/60">No pending contributions right now.</p>
      ) : (
        <div className="overflow-x-auto border border-olive/15">
          <table className="w-full min-w-150 text-left text-sm">
            <thead>
              <tr className="border-b border-olive/15 text-[11px] tracking-widest text-foreground/50 uppercase">
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((c) => (
                <tr key={c.id} className="border-b border-olive/10 last:border-0">
                  <td className="px-4 py-3 text-foreground">{c.guestName}</td>
                  <td className="px-4 py-3 text-foreground/70">{c.itemName}</td>
                  <td className="px-4 py-3 text-foreground/70">{formatNaira(c.amountCents)}</td>
                  <td className="px-4 py-3 text-foreground/70">{c.dateRequested}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isPending(c.id)}
                      onClick={() => run(c.id, "confirm", () => onConfirm(c))}
                      className="bg-burnt-orange px-3 py-1.5 text-xs font-medium text-ivory hover:bg-burnt-orange-dark disabled:opacity-60"
                    >
                      {isPending(c.id, "confirm") ? "Confirming…" : "Confirm"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-10 mb-5 font-(family-name:--serif) text-2xl text-foreground">Confirmed Contributions</h2>

      {confirmed.length === 0 ? (
        <p className="text-sm text-foreground/60">No confirmed contributions yet.</p>
      ) : (
        <div className="overflow-x-auto border border-olive/15">
          <table className="w-full min-w-150 text-left text-sm">
            <thead>
              <tr className="border-b border-olive/15 text-[11px] tracking-widest text-foreground/50 uppercase">
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Confirmed</th>
              </tr>
            </thead>
            <tbody>
              {confirmed.map((c) => (
                <tr key={c.id} className="border-b border-olive/10 last:border-0">
                  <td className="px-4 py-3 text-foreground">{c.guestName}</td>
                  <td className="px-4 py-3 text-foreground/70">{c.itemName}</td>
                  <td className="px-4 py-3 text-foreground/70">{formatNaira(c.amountCents)}</td>
                  <td className="px-4 py-3 text-foreground/70">{c.dateConfirmed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
