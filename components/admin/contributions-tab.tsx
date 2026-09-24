"use client";

import type { ConfirmedContributionView, PendingContributionView } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { useActionPending } from "./use-action-pending";
import { useAdminMoney } from "./wedding-context";


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
  const money = useAdminMoney();

  return (
    <div>
      <h2 className="mb-5 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">Pending Contributions</h2>

      {pending.length === 0 ? (
        <p className="text-sm text-foreground/60">No pending contributions right now.</p>
      ) : (
        <div className="overflow-x-auto rounded-[6px] border border-(--m-mist) bg-white">
          <table className="w-full min-w-150 text-left text-sm">
            <thead>
              <tr className="border-b border-(--m-mist) text-xs text-foreground/50">
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((c) => (
                <tr key={c.id} className="border-b border-(--m-mist) last:border-0">
                  <td className="px-4 py-3 text-foreground">{c.guestName}</td>
                  <td className="px-4 py-3 text-foreground/70">{c.itemName}</td>
                  <td className="px-4 py-3 text-foreground/70">{formatMoney(c.amountCents, money)}</td>
                  <td className="px-4 py-3 text-foreground/70">{c.dateRequested}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isPending(c.id)}
                      onClick={() => run(c.id, "confirm", () => onConfirm(c))}
                      className="rounded-full bg-(--m-gold) px-3 py-1.5 text-xs font-semibold text-(--m-ink) hover:bg-(--m-ink) hover:text-(--m-paper) disabled:opacity-60"
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

      <h2 className="mt-10 mb-5 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">Confirmed Contributions</h2>

      {confirmed.length === 0 ? (
        <p className="text-sm text-foreground/60">No confirmed contributions yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-[6px] border border-(--m-mist) bg-white">
          <table className="w-full min-w-150 text-left text-sm">
            <thead>
              <tr className="border-b border-(--m-mist) text-xs text-foreground/50">
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Confirmed</th>
              </tr>
            </thead>
            <tbody>
              {confirmed.map((c) => (
                <tr key={c.id} className="border-b border-(--m-mist) last:border-0">
                  <td className="px-4 py-3 text-foreground">{c.guestName}</td>
                  <td className="px-4 py-3 text-foreground/70">{c.itemName}</td>
                  <td className="px-4 py-3 text-foreground/70">{formatMoney(c.amountCents, money)}</td>
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
