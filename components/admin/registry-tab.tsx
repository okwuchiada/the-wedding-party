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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FIELD, FIELD_LABEL, FILE_INPUT, TEXT_ACTION } from "./form-styles";
import { cn } from "@/lib/utils";


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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 bg-paper p-4 sm:grid-cols-2">
      {initialValues?.id && <input type="hidden" name="id" defaultValue={initialValues.id} />}

      <Label className={FIELD_LABEL}>
        Name
        <Input
          name="name"
          defaultValue={initialValues?.name}
          className={FIELD}
        />
      </Label>

      <CategoryField name="category" defaultValue={initialValues?.category} existing={categories} />

      <Label className={FIELD_LABEL}>
        Price ({currencySymbol(money)})
        <Input
          name="price"
          type="number"
          min={1}
          step="0.01"
          defaultValue={initialValues?.price}
          className={FIELD}
        />
      </Label>

      <Label className={FIELD_LABEL}>
        Image URL
        <Input
          name="image"
          defaultValue={initialValues?.image}
          className={FIELD}
        />
      </Label>

      <Label className={cn(FIELD_LABEL, "sm:col-span-2")}>
        …or upload a photo
        <Input name="file" type="file" accept="image/*,.heic,.heif" className={cn(FIELD, FILE_INPUT)} />
        {initialValues?.image && (
          <span className="mt-1 text-[11px] text-ink/50">
            Leave blank to keep the current image
          </span>
        )}
      </Label>

      <Label className={cn(FIELD_LABEL, "sm:col-span-2")}>
        Buy link (optional)
        <Input
          name="externalUrl"
          defaultValue={initialValues?.externalUrl ?? ""}
          className={FIELD}
        />
      </Label>

      {(uploadError || state?.error) && (
        <p className="text-xs text-coral-deep sm:col-span-2">{uploadError || state?.error}</p>
      )}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending || uploading}>
          {uploading ? "Uploading…" : pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function BankDetailsForm({
  bankDetails,
  onCancel,
}: {
  bankDetails: BankDetailsView;
  onCancel: () => void;
}) {
  const weddingId = useAdminWeddingId();
  const [state, formAction, pending] = useActionState(saveBankDetails.bind(null, weddingId), undefined);

  useEffect(() => {
    if (state?.success) onCancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 bg-paper p-4 sm:grid-cols-2">
      <Label className={FIELD_LABEL}>
        Account name
        <Input
          name="name"
          defaultValue={bankDetails.name}
          className={FIELD}
        />
      </Label>
      <Label className={FIELD_LABEL}>
        Bank
        <Input
          name="bank"
          defaultValue={bankDetails.bank}
          className={FIELD}
        />
      </Label>
      <Label className={FIELD_LABEL}>
        Account number
        <Input
          name="account"
          defaultValue={bankDetails.account}
          className={FIELD}
        />
      </Label>
      <Label className={FIELD_LABEL}>
        Routing number (optional)
        <Input
          name="routing"
          defaultValue={bankDetails.routing}
          className={FIELD}
        />
      </Label>
      <Label className={FIELD_LABEL}>
        SWIFT / BIC (optional)
        <Input
          name="swift"
          defaultValue={bankDetails.swift ?? ""}
          className={FIELD}
        />
      </Label>

      {state?.error && <p className="text-xs text-coral-deep sm:col-span-2">{state.error}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
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

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Delete "${name}"?`,
      description: "This can't be undone.",
    });
    if (!ok) return;
    setDeleteError("");
    await run(id, "delete", async () => {
      const result = await deleteRegistryItem(weddingId, id);
      if (result.error) setDeleteError(result.error);
    });
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-ink">Bank Details</h2>
        {!editingBank && (
          <Button
            type="button"
            variant="link"
            size="xs"
            onClick={() => setEditingBank(true)}
            className={TEXT_ACTION}
          >
            Edit
          </Button>
        )}
      </div>

      {editingBank ? (
        <div className="mb-10">
          <BankDetailsForm bankDetails={bankDetails} onCancel={() => setEditingBank(false)} />
        </div>
      ) : (
        <Card className="mb-10 grid grid-cols-2 gap-4 rounded-md p-4 text-sm shadow-none sm:grid-cols-4">
          <div>
            <p className="text-xs text-ink/50">Account name</p>
            <p className="mt-1 text-ink">{bankDetails.name}</p>
          </div>
          <div>
            <p className="text-xs text-ink/50">Bank</p>
            <p className="mt-1 text-ink">{bankDetails.bank}</p>
          </div>
          <div>
            <p className="text-xs text-ink/50">Account no.</p>
            <p className="mt-1 text-ink">{bankDetails.account}</p>
          </div>
          <div>
            <p className="text-xs text-ink/50">Routing</p>
            <p className="mt-1 text-ink">{bankDetails.routing || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-ink/50">SWIFT / BIC</p>
            <p className="mt-1 text-ink">{bankDetails.swift ?? "—"}</p>
          </div>
        </Card>
      )}

      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-ink">Registry Items</h2>
        {!adding && (
          <Button type="button" size="sm" onClick={() => setAdding(true)}>
            Add Item
          </Button>
        )}
      </div>

      {adding && (
        <div className="mb-5">
          <RegistryItemForm
            action={createRegistryItem.bind(null, weddingId)}
            onCancel={() => setAdding(false)}
            submitLabel="Add Item"
            categories={categories}
          />
        </div>
      )}

      {deleteError && <p className="mb-3 text-xs text-coral-deep">{deleteError}</p>}

      <div className="overflow-hidden rounded-md border border-mist bg-white">
        <Table className="min-w-150">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 text-ink/50">Item</TableHead>
              <TableHead className="px-4 text-ink/50">Category</TableHead>
              <TableHead className="px-4 text-ink/50">Goal</TableHead>
              <TableHead className="px-4 text-ink/50">Raised</TableHead>
              <TableHead className="px-4 text-ink/50">Claimed by</TableHead>
              <TableHead className="px-4 text-ink/50">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((item) =>
              editingId === item.id ? (
                <TableRow key={item.id} className="hover:bg-transparent">
                  <TableCell colSpan={6} className="p-0">
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
                      submitLabel="Save Changes"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={item.id}>
                  <TableCell className="px-4 text-ink">{item.name}</TableCell>
                  <TableCell className="px-4 text-ink/70">{item.category}</TableCell>
                  <TableCell className="px-4 text-ink/70">{formatMoney(item.priceCents, money)}</TableCell>
                  <TableCell className="px-4 text-ink/70">
                    {formatMoney(sumContributions(item.contributions), money)}
                  </TableCell>
                  <TableCell className="px-4 text-ink/70">{item.claimedBy ?? "—"}</TableCell>
                  <TableCell className="px-4">
                    <Button
                      type="button"
                      variant="link"
                      size="xs"
                      disabled={isPending(item.id)}
                      onClick={() => setEditingId(item.id)}
                      className={cn(TEXT_ACTION, "mr-3")}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      size="xs"
                      disabled={isPending(item.id)}
                      onClick={() => handleDelete(item.id, item.name)}
                      className={TEXT_ACTION}
                    >
                      {isPending(item.id, "delete") ? "Deleting…" : "Delete"}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
      {confirmDialog}
    </div>
  );
}
