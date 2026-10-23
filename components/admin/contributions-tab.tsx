"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import type { ConfirmedContributionView, PendingContributionView } from "@/lib/types";
import {
  deleteRecordedContribution,
  recordContribution,
  updateRecordedContribution,
  type RecordedGiftState,
} from "@/lib/actions/contributions";
import { currencySymbol, formatMoney } from "@/lib/money";
import { MAX_GIFT_NOTE_LENGTH, MAX_GUEST_NAME_LENGTH } from "@/lib/recorded-gift";
import { TEXT_ACTION } from "@/components/admin/form-styles";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MoneyField, SelectInput, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { useToast } from "@/components/ui/toast";
import { SectionHeading } from "@/components/ui/section-heading";
import { Segmented } from "@/components/ui/segmented";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, usePagination } from "./pagination";
import { useConfirm } from "./use-confirm";
import { useActionPending } from "./use-action-pending";
import { useAdminMoney, useAdminWeddingId } from "./wedding-context";

type View = "pending" | "confirmed";
type RegistryOption = { id: string; name: string };

/** Records (or corrects) a gift the couple received outside the site, e.g. cash at the reception. */
function RecordGiftForm({
  items,
  editing,
  onSaved,
  onCancel,
}: {
  items: RegistryOption[];
  /** The recorded gift being corrected; empty for a new one. */
  editing?: ConfirmedContributionView;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const weddingId = useAdminWeddingId();
  const money = useAdminMoney();
  const toast = useToast();
  const action = editing ? updateRecordedContribution.bind(null, weddingId, editing.id) : recordContribution.bind(null, weddingId);
  const [state, formAction, pending] = useActionState<RecordedGiftState, FormData>(action, undefined);

  useEffect(() => {
    if (!state?.success) return;
    toast({ message: editing ? "Gift updated" : "Gift recorded" });
    onSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        // As a transition, so the dashboard stays put while it refreshes.
        startTransition(() => formAction(data));
      }}
      className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-accent p-4 sm:grid-cols-2"
    >
      <p className="text-sm text-muted-foreground sm:col-span-2">
        {editing
          ? "Correct the details of a gift you recorded."
          : "For gifts that didn't come through your site, like cash at the reception or a transfer straight to your account. It counts towards the gift right away."}
      </p>
      <TextInput label="From" name="guestName" required maxLength={MAX_GUEST_NAME_LENGTH} defaultValue={editing?.guestName} placeholder="e.g. Aunty Bisi" />
      <SelectInput
        label="Towards"
        name="registryItemId"
        required
        defaultValue={editing?.recorded?.registryItemId ?? (items.length === 1 ? items[0].id : "")}
        options={items.map((item) => ({ value: item.id, label: item.name }))}
      />
      <MoneyField
        label={
          <>
            Amount <span className="sr-only">in {money.currency}</span>
          </>
        }
        symbol={currencySymbol(money)}
        name="amount"
        min={0.01}
        step="0.01"
        required
        defaultValue={editing ? editing.amountCents / 100 : undefined}
      />
      <TextInput
        label="How you received it (optional)"
        name="note"
        maxLength={MAX_GIFT_NOTE_LENGTH}
        defaultValue={editing?.recorded?.note ?? ""}
        placeholder="e.g. Cash at the reception"
      />
      {state?.error && (
        <div className="sm:col-span-2">
          <Notice tone="error">{state.error}</Notice>
        </div>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Record gift"}
        </Button>
      </div>
    </form>
  );
}

export default function ContributionsTab({
  pending,
  confirmed,
  items,
  onConfirm,
}: {
  pending: PendingContributionView[];
  confirmed: ConfirmedContributionView[];
  /** Registry items a recorded gift can go towards. */
  items: RegistryOption[];
  onConfirm: (contribution: PendingContributionView) => Promise<void>;
}) {
  const weddingId = useAdminWeddingId();
  const toast = useToast();
  const [view, setView] = useState<View>("pending");
  // Which recorded-gift form is open: a new gift, one being corrected, or none.
  const [form, setForm] = useState<{ editing?: ConfirmedContributionView } | null>(null);
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

  const handleDelete = async (c: ConfirmedContributionView) => {
    const ok = await confirm({
      title: `Delete ${formatMoney(c.amountCents, money)} from ${c.guestName}?`,
      description: "It will stop counting towards the gift. This can't be undone.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    await run(c.id, "delete", async () => {
      const result = await deleteRecordedContribution(weddingId, c.id);
      toast({ message: result.error ?? "Gift deleted" });
    });
  };

  return (
    <div>
      <SectionHeading
        title="Contributions"
        description="Guests tell you here when they've sent money for a gift. Confirm each one once it's in your account. Got a gift another way? Record it so it counts too."
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

      {form ? (
        <RecordGiftForm
          key={form.editing?.id ?? "new"}
          items={items}
          editing={form.editing}
          onSaved={() => {
            setForm(null);
            // Recorded gifts are confirmed, so show them where they landed.
            setView("confirmed");
          }}
          onCancel={() => setForm(null)}
        />
      ) : (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button size="sm" variant="outline" disabled={items.length === 0} onClick={() => setForm({})}>
            Record a gift received outside the site
          </Button>
          {items.length === 0 && <span className="text-[13px] text-muted-foreground">Add a gift to your registry first.</span>}
        </div>
      )}

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
          <EmptyState title="No confirmed gifts yet" body="Gifts you confirm or record move here and count towards each registry item." />
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
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmedPage.pageItems.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold">{c.guestName}</TableCell>
                      <TableCell className="text-muted-foreground">{c.itemName}</TableCell>
                      <TableCell>
                        {c.recorded ? (
                          <>
                            <span className="inline-block rounded-full bg-gold/30 px-2 py-0.5 text-xs font-semibold text-ink">Recorded by you</span>
                            {c.recorded.note && <span className="mt-1 block text-[13px] text-muted-foreground">{c.recorded.note}</span>}
                          </>
                        ) : (
                          <span className="font-mono text-[13px]">{c.reference ?? "—"}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(c.amountCents, money)}</TableCell>
                      <TableCell className="text-muted-foreground">{c.dateConfirmed}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {c.recorded && (
                          <>
                            <Button size="xs" variant="link" className={TEXT_ACTION} onClick={() => setForm({ editing: c })}>
                              Edit
                            </Button>
                            <Button size="xs" variant="link" className={TEXT_ACTION} disabled={isPending(c.id)} onClick={() => handleDelete(c)}>
                              {isPending(c.id, "delete") ? "Deleting…" : "Delete"}
                            </Button>
                          </>
                        )}
                      </TableCell>
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
