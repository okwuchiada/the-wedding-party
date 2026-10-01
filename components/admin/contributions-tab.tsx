"use client";

import { useState } from "react";
import type { ConfirmedContributionView, PendingContributionView } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { Segmented } from "@/components/ui/segmented";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
            <div className="overflow-hidden rounded-md border bg-card">
              <Table className="min-w-150">
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Gift</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>
                      <span className="sr-only">Action</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPage.pageItems.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold">{c.guestName}</TableCell>
                      <TableCell className="text-muted-foreground">{c.itemName}</TableCell>
                      <TableCell className="font-mono text-[13px]">{c.reference ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(c.amountCents, money)}</TableCell>
                      <TableCell className="text-muted-foreground">{c.dateRequested}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" disabled={isPending(c.id)} onClick={() => handleConfirm(c)}>
                          {isPending(c.id, "confirm") ? "Confirming…" : "Confirm"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination page={pendingPage.page} pageSize={pendingPage.pageSize} total={pendingPage.total} onPageChange={pendingPage.setPage} onPageSizeChange={pendingPage.setPageSize} />
          </>
        ))}

      {view === "confirmed" &&
        (confirmed.length === 0 ? (
          <EmptyState title="No confirmed gifts yet" body="Gifts you confirm move here and count towards each registry item." />
        ) : (
          <>
            <div className="overflow-hidden rounded-md border bg-card">
              <Table className="min-w-150">
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Gift</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Confirmed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmedPage.pageItems.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold">{c.guestName}</TableCell>
                      <TableCell className="text-muted-foreground">{c.itemName}</TableCell>
                      <TableCell className="font-mono text-[13px]">{c.reference ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(c.amountCents, money)}</TableCell>
                      <TableCell className="text-muted-foreground">{c.dateConfirmed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination page={confirmedPage.page} pageSize={confirmedPage.pageSize} total={confirmedPage.total} onPageChange={confirmedPage.setPage} onPageSizeChange={confirmedPage.setPageSize} />
          </>
        ))}

      {confirmDialog}
    </div>
  );
}
