"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import type { BankDetailsView, RegistryItemWithContributions } from "@/lib/types";
import {
  createRegistryItem,
  createRegistryItemUploadUrl,
  deleteRegistryItem,
  updateRegistryItem,
  type RegistryItemFormState,
} from "@/lib/actions/registry";
import { saveBankDetails } from "@/lib/actions/bank-details";
import { convertHeicToJpeg } from "@/lib/heic";
import { compressImage } from "@/lib/image-compress";
import { useConfirm } from "./use-confirm";
import { currencySymbol, formatMoney } from "@/lib/money";
import CategoryField from "./category-field";
import { Pagination, usePagination } from "./pagination";
import { useAdminMoney, useAdminWeddingId } from "./wedding-context";
import { useActionPending } from "./use-action-pending";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MoneyField, SelectInput, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SectionHeading } from "@/components/ui/section-heading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NG_BANKS, normaliseAccountNumber } from "@/lib/bank-account";
import { FIELD, FILE_INPUT, TEXT_ACTION } from "@/components/admin/form-styles";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


function sumContributions(contributions: { amountCents: number }[]) {
  return contributions.reduce((sum, c) => sum + c.amountCents, 0);
}

type ItemFormValues = {
  id?: string;
  name?: string;
  category?: string;
  price?: number;
  image?: string;
  externalUrl?: string | null;
};

function RegistryItemForm({
  action,
  initialValues,
  onCancel,
  submitLabel,
  categories,
}: {
  action: (state: RegistryItemFormState, formData: FormData) => Promise<RegistryItemFormState>;
  initialValues?: ItemFormValues;
  /** Categories already on this registry, for the dropdown. */
  categories: string[];
  onCancel: () => void;
  submitLabel: string;
}) {
  const weddingId = useAdminWeddingId();
  const money = useAdminMoney();
  const [state, formAction, pending] = useActionState(action, undefined);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  // The file upload is the default; a pasted link is the fallback for photos already online.
  const [pasteLink, setPasteLink] = useState(false);

  useEffect(() => {
    if (state?.success) onCancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError("");

    const formData = new FormData(e.currentTarget);
    const rawFile = formData.get("file");

    if (rawFile instanceof File && rawFile.size > 0) {
      setUploading(true);
      const file = await compressImage(await convertHeicToJpeg(rawFile));
      const urlResult = await createRegistryItemUploadUrl(weddingId, file.name, file.type, file.size);
      if (!urlResult || urlResult.error || !urlResult.uploadUrl || !urlResult.publicUrl) {
        setUploading(false);
        setUploadError(urlResult?.error ?? "Upload failed. Please try again.");
        return;
      }

      const putResponse = await fetch(urlResult.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      setUploading(false);

      if (!putResponse.ok) {
        setUploadError("Upload failed. Please try again.");
        return;
      }

      formData.set("image", urlResult.publicUrl);
    }
    formData.delete("file");

    // Run the action as a transition: the dashboard keeps showing while the server
    // refreshes it, instead of dropping to the full-page loading screen (which looked
    // like a page reload and jumped back to the top).
    startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-[8px] bg-accent p-4 sm:grid-cols-2">
      {initialValues?.id && <input type="hidden" name="id" defaultValue={initialValues.id} />}

      <TextInput label="Name" name="name" defaultValue={initialValues?.name} required />

      <CategoryField name="category" defaultValue={initialValues?.category} existing={categories} />

      <MoneyField
        label={
          <>
            Price <span className="sr-only">in {money.currency}</span>
          </>
        }
        symbol={currencySymbol(money)}
        name="price"
        min={1}
        step="0.01"
        defaultValue={initialValues?.price}
        required
      />

      <TextInput label="Buy link (optional)" name="externalUrl" type="url" defaultValue={initialValues?.externalUrl ?? ""} placeholder="https://" />

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        {pasteLink ? (
          <TextInput label="Image link" name="image" defaultValue={initialValues?.image} placeholder="https://" />
        ) : (
          <>
            <Label htmlFor="registry-photo" className="text-sm font-medium text-ink">
              Photo
            </Label>
            <Input
              id="registry-photo"
              name="file"
              type="file"
              accept="image/*,.heic,.heif"
              className={cn(FIELD, FILE_INPUT)}
            />
            {initialValues?.image && <input type="hidden" name="image" defaultValue={initialValues.image} />}
            {initialValues?.image && <span className="text-[13px] text-muted-foreground">Leave empty to keep the current photo.</span>}
          </>
        )}
        <Button size="xs" variant="link" className={cn(TEXT_ACTION, "self-start")} onClick={() => setPasteLink((v) => !v)}>
          {pasteLink ? "Upload a photo instead" : "Paste an image link instead"}
        </Button>
      </div>

      {(uploadError || state?.error) && (
        <div className="sm:col-span-2">
          <Notice tone="error">{uploadError || state?.error}</Notice>
        </div>
      )}

      <div className="flex gap-2 sm:col-span-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending || uploading}>
          {uploading ? "Uploading…" : pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

const OTHER_BANK = "__other";

function BankDetailsForm({
  bankDetails,
  onCancel,
}: {
  bankDetails: BankDetailsView;
  onCancel: () => void;
}) {
  const weddingId = useAdminWeddingId();
  const money = useAdminMoney();
  const naira = money.currency === "NGN";
  const [state, formAction, pending] = useActionState(saveBankDetails.bind(null, weddingId), undefined);
  const knownBank = (NG_BANKS as readonly string[]).includes(bankDetails.bank);
  const [bankChoice, setBankChoice] = useState(bankDetails.bank && !knownBank ? OTHER_BANK : bankDetails.bank);
  const [account, setAccount] = useState(bankDetails.account);
  const [showSwift, setShowSwift] = useState(Boolean(bankDetails.swift));
  const digits = normaliseAccountNumber(account).length;

  useEffect(() => {
    if (state?.success) onCancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 rounded-[8px] bg-accent p-4 sm:grid-cols-2">
      {naira ? (
        <>
          <SelectInput
            label="Bank"
            name={bankChoice === OTHER_BANK ? undefined : "bank"}
            value={bankChoice}
            onValueChange={setBankChoice}
            placeholder="Choose your bank"
            options={[...NG_BANKS.map((b) => ({ value: b, label: b })), { value: OTHER_BANK, label: "Other bank" }]}
            required
          />
          {bankChoice === OTHER_BANK && <TextInput label="Bank name" name="bank" defaultValue={knownBank ? "" : bankDetails.bank} required />}
        </>
      ) : (
        <TextInput label="Bank" name="bank" defaultValue={bankDetails.bank} required />
      )}
      <TextInput
        label="Account number"
        name="account"
        inputMode={naira ? "numeric" : undefined}
        maxLength={naira ? 13 : undefined}
        value={account}
        onChange={(e) => setAccount(e.target.value)}
        hint={naira ? (digits === 10 ? "✓ 10 digits" : `${digits} of 10 digits`) : undefined}
        required
      />
      <TextInput label="Account name" name="name" defaultValue={bankDetails.name} autoComplete="off" required />
      {showSwift ? (
        <TextInput label="SWIFT / BIC (optional)" name="swift" defaultValue={bankDetails.swift ?? ""} hint="Only needed for gifts from banks abroad." />
      ) : (
        <Button size="xs" variant="link" className={cn(TEXT_ACTION, "self-end justify-self-start")} onClick={() => setShowSwift(true)}>
          Guests abroad? Add a SWIFT code
        </Button>
      )}

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
          {pending ? "Saving…" : "Save bank details"}
        </Button>
      </div>
    </form>
  );
}

export default function RegistryTab({
  items,
  bankDetails,
}: {
  items: RegistryItemWithContributions[];
  bankDetails: BankDetailsView;
}) {
  const weddingId = useAdminWeddingId();
  const money = useAdminMoney();
  const [adding, setAdding] = useState(false);
  // Categories in use, in the order they first appear (matches the guest registry's tabs).
  const categories = [...new Set(items.map((item) => item.category))];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBank, setEditingBank] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { confirm, confirmDialog } = useConfirm();
  const { run, isPending } = useActionPending();
  const { page, pageSize, pageItems, total, setPage, setPageSize } = usePagination(items);
  const hasBank = Boolean(bankDetails.account);

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Delete "${name}"?`,
      description: "This can't be undone.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    setDeleteError("");
    await run(id, "delete", async () => {
      const result = await deleteRegistryItem(weddingId, id);
      if (result.error) setDeleteError(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-10">
      {!hasBank && !editingBank && (
        <Notice tone="warning" action={<Button size="sm" onClick={() => setEditingBank(true)}>Add bank details</Button>}>
          Guests can&apos;t give until you add bank details.
        </Notice>
      )}

      <section>
        {editingBank ? (
          <>
            <SectionHeading title="Where cash gifts go" />
            <BankDetailsForm bankDetails={bankDetails} onCancel={() => setEditingBank(false)} />
          </>
        ) : hasBank ? (
          <Card className="gap-0 rounded-md p-5 shadow-none block">
            <SectionHeading
              as="h3"
              title="Where cash gifts go"
              action={
                <Button size="xs" className={TEXT_ACTION} variant="link" onClick={() => setEditingBank(true)}>
                  Edit
                </Button>
              }
            />
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-[13px] text-muted-foreground">Account name</dt>
                <dd className="mt-1 text-ink">{bankDetails.name}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-muted-foreground">Bank</dt>
                <dd className="mt-1 text-ink">{bankDetails.bank}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-muted-foreground">Account number</dt>
                <dd className="mt-1 text-ink tabular-nums">{bankDetails.account}</dd>
              </div>
              {bankDetails.swift && (
                <div>
                  <dt className="text-[13px] text-muted-foreground">SWIFT / BIC</dt>
                  <dd className="mt-1 text-ink">{bankDetails.swift}</dd>
                </div>
              )}
            </dl>
          </Card>
        ) : null}
      </section>

      <section>
        <SectionHeading
          title="Registry items"
          action={
            !adding && items.length > 0 && (
              <Button size="sm" onClick={() => setAdding(true)}>
                Add a gift
              </Button>
            )
          }
        />

        {adding && (
          <div className="mb-5">
            <RegistryItemForm
              action={createRegistryItem.bind(null, weddingId)}
              onCancel={() => setAdding(false)}
              submitLabel="Add gift"
              categories={categories}
            />
          </div>
        )}

        {deleteError && (
          <div className="mb-3">
            <Notice tone="error">{deleteError}</Notice>
          </div>
        )}

        {items.length === 0 ? (
          !adding && (
            <EmptyState
              title="No gifts yet"
              body="Add a few things for your new home, or a fund guests can chip into."
              action={
                <Button size="sm" onClick={() => setAdding(true)}>
                  Add your first gift
                </Button>
              }
            />
          )
        ) : (
          <>
            <div className="overflow-hidden rounded-md border bg-card">
              <Table className="min-w-150">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <span className="sr-only">Photo</span>
                    </TableHead>
                    <TableHead>Gift</TableHead>
                    <TableHead>Raised</TableHead>
                    <TableHead className="text-right">Goal</TableHead>
                    <TableHead>Claimed by</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((item) => {
                    const raised = sumContributions(item.contributions);
                    const pct = Math.min(100, Math.round((raised / item.priceCents) * 100));
                    return editingId === item.id ? (
                      <TableRow key={item.id}>
                        <TableCell colSpan={6} className="p-0 whitespace-normal">
                          <RegistryItemForm
                            action={updateRegistryItem.bind(null, weddingId)}
                            categories={categories}
                            initialValues={{
                              id: item.id,
                              name: item.name,
                              category: item.category,
                              price: item.priceCents / 100,
                              image: item.image,
                              externalUrl: item.externalUrl,
                            }}
                            onCancel={() => setEditingId(null)}
                            submitLabel="Save changes"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={item.id}>
                        <TableCell className="w-14">
                          {item.image ? (
                            <Image src={item.image} alt="" width={40} height={40} className="size-10 rounded-[4px] object-cover" />
                          ) : (
                            <span className="block size-10 rounded-[4px] bg-accent" />
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{item.name}</span>
                          <span className="block text-[13px] text-muted-foreground">{item.category}</span>
                        </TableCell>
                        <TableCell className="min-w-40">
                          <span className="block h-1 overflow-hidden rounded-full bg-border" aria-hidden>
                            <span className="block h-full bg-emerald" style={{ width: `${pct}%` }} />
                          </span>
                          <span className="mt-1 block text-[13px] tabular-nums">
                            {formatMoney(raised, money)} <span className="text-muted-foreground">· {pct}%</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(item.priceCents, money)}</TableCell>
                        <TableCell className="text-muted-foreground">{item.claimedBy ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <Button size="xs" variant="link" className={cn(TEXT_ACTION, "mr-3")} disabled={isPending(item.id)} onClick={() => setEditingId(item.id)}>
                            Edit
                          </Button>
                          <Button size="xs" className={TEXT_ACTION} variant="link" disabled={isPending(item.id)} onClick={() => handleDelete(item.id, item.name)}>
                            {isPending(item.id, "delete") ? "Deleting…" : "Delete"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </>
        )}
      </section>

      {confirmDialog}
    </div>
  );
}
