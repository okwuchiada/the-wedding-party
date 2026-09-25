"use client";

import { useState } from "react";
import type { ConfirmedContributionView, PendingContributionView } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { Segmented } from "@/components/ui/segmented";
import { TableShell, Td, Th } from "@/components/ui/table";
import { Pagination, usePagination } from "./pagination";
import { useConfirm } from "./use-confirm";
import { useActionPending } from "./use-action-pending";
import { useAdminMoney } from "./wedding-context";

type View = "pending" | "confirmed";

export default function ContributionsTab({
  pending,
  confirmed,
  onConfirm,
}: {
  pending: PendingContributionView[];
  confirmed: ConfirmedContributionView[];
  onConfirm: (contribution: PendingContributionView) => Promise<void>;
}) {
  const [view, setView] = useState<View>("pending");
  const { run, isPending } = useActionPending();
  const { confirm, confirmDialog } = useConfirm();
  const money = useAdminMoney();
  const pendingPage = usePagination(pending);
  const confirmedPage = usePagination(confirmed);

  const handleConfirm = async (c: PendingContributionView) => {
    const ok = await confirm({
      title: `Confirm ${formatMoney(c.amountCents, money)} from ${c.guestName}?`,
      description: c.reference
        ? `Check your bank app for a transfer with the reference ${c.reference} before confirming.`
        : `Check your bank app for a transfer from ${c.guestName} before confirming.`,
      confirmLabel: "Confirm",
      danger: false,
    });
    if (!ok) return;
    await run(c.id, "confirm", () => onConfirm(c));
  };

  return (
    <div>
      <SectionHeading
        title="Contributions"
        description="Guests tell you here when they've sent money for a gift. Confirm each one once it's in your account."
        action={
          <Segmented
            label="Show"
            value={view}
            onChange={setView}
            options={[
              { value: "pending", label: "To confirm", count: pending.length },
              { value: "confirmed", label: "Confirmed", count: confirmed.length },
            ]}
          />
        }
      />

      {view === "pending" &&
        (pending.length === 0 ? (
          <EmptyState title="Nothing to confirm" body="When a guest says they've sent money, it shows here for you to check." />
        ) : (
          <>
            <TableShell>
              <thead>
                <tr>
                  <Th>Guest</Th>
                  <Th>Gift</Th>
                  <Th>Reference</Th>
                  <Th numeric>Amount</Th>
                  <Th>Sent</Th>
                  <Th>
                    <span className="sr-only">Action</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {pendingPage.pageItems.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-semibold">{c.guestName}</Td>
                    <Td className="text-muted">{c.itemName}</Td>
                    <Td className="font-mono text-[13px]">{c.reference ?? "—"}</Td>
                    <Td numeric>{formatMoney(c.amountCents, money)}</Td>
                    <Td className="text-muted">{c.dateRequested}</Td>
                    <Td className="text-right">
                      <Button size="sm" disabled={isPending(c.id)} onClick={() => handleConfirm(c)}>
                        {isPending(c.id, "confirm") ? "Confirming…" : "Confirm"}
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
            <Pagination page={pendingPage.page} pageSize={pendingPage.pageSize} total={pendingPage.total} onPageChange={pendingPage.setPage} onPageSizeChange={pendingPage.setPageSize} />
          </>
        ))}

      {view === "confirmed" &&
        (confirmed.length === 0 ? (
          <EmptyState title="No confirmed gifts yet" body="Gifts you confirm move here and count towards each registry item." />
        ) : (
          <>
            <TableShell>
              <thead>
                <tr>
                  <Th>Guest</Th>
                  <Th>Gift</Th>
                  <Th>Reference</Th>
                  <Th numeric>Amount</Th>
                  <Th>Confirmed</Th>
                </tr>
              </thead>
              <tbody>
                {confirmedPage.pageItems.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-semibold">{c.guestName}</Td>
                    <Td className="text-muted">{c.itemName}</Td>
                    <Td className="font-mono text-[13px]">{c.reference ?? "—"}</Td>
                    <Td numeric>{formatMoney(c.amountCents, money)}</Td>
                    <Td className="text-muted">{c.dateConfirmed}</Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
            <Pagination page={confirmedPage.page} pageSize={confirmedPage.pageSize} total={confirmedPage.total} onPageChange={confirmedPage.setPage} onPageSizeChange={confirmedPage.setPageSize} />
          </>
        ))}

      {confirmDialog}
    </div>
  );
}
