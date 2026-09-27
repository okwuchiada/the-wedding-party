"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ConfirmedContributionView, PendingContributionView } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { Pagination, usePagination } from "./pagination";
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
  const pendingPage = usePagination(pending);
  const confirmedPage = usePagination(confirmed);

  return (
    <div>
      <h2 className="mb-5 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-ink">Pending Contributions</h2>

      {pending.length === 0 ? (
        <p className="text-sm text-ink/60">No pending contributions right now.</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-md border border-mist bg-white">
            <Table className="min-w-150">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4 text-ink/50">Guest</TableHead>
                  <TableHead className="px-4 text-ink/50">Item</TableHead>
                  <TableHead className="px-4 text-ink/50">Amount</TableHead>
                  <TableHead className="px-4 text-ink/50">Requested</TableHead>
                  <TableHead className="px-4 text-ink/50">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPage.pageItems.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="px-4 text-ink">{c.guestName}</TableCell>
                    <TableCell className="px-4 text-ink/70">{c.itemName}</TableCell>
                    <TableCell className="px-4 text-ink/70">{formatMoney(c.amountCents, money)}</TableCell>
                    <TableCell className="px-4 text-ink/70">{c.dateRequested}</TableCell>
                    <TableCell className="px-4">
                      <Button type="button" size="xs" disabled={isPending(c.id)} onClick={() => run(c.id, "confirm", () => onConfirm(c))}>
                        {isPending(c.id, "confirm") ? "Confirming…" : "Confirm"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={pendingPage.page}
            pageSize={pendingPage.pageSize}
            total={pendingPage.total}
            onPageChange={pendingPage.setPage}
            onPageSizeChange={pendingPage.setPageSize}
          />
        </>
      )}

      <h2 className="mt-10 mb-5 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-ink">Confirmed Contributions</h2>

      {confirmed.length === 0 ? (
        <p className="text-sm text-ink/60">No confirmed contributions yet.</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-md border border-mist bg-white">
            <Table className="min-w-150">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4 text-ink/50">Guest</TableHead>
                  <TableHead className="px-4 text-ink/50">Item</TableHead>
                  <TableHead className="px-4 text-ink/50">Amount</TableHead>
                  <TableHead className="px-4 text-ink/50">Confirmed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmedPage.pageItems.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="px-4 text-ink">{c.guestName}</TableCell>
                    <TableCell className="px-4 text-ink/70">{c.itemName}</TableCell>
                    <TableCell className="px-4 text-ink/70">{formatMoney(c.amountCents, money)}</TableCell>
                    <TableCell className="px-4 text-ink/70">{c.dateConfirmed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={confirmedPage.page}
            pageSize={confirmedPage.pageSize}
            total={confirmedPage.total}
            onPageChange={confirmedPage.setPage}
            onPageSizeChange={confirmedPage.setPageSize}
          />
        </>
      )}
    </div>
  );
}
