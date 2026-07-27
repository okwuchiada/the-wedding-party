"use client";

import { useActionState, useEffect, useState } from "react";
import type { BankDetailsView, RegistryItemWithContributions } from "@/lib/types";
import {
  createRegistryItem,
  deleteRegistryItem,
  updateRegistryItem,
  type RegistryItemFormState,
} from "@/lib/actions/registry";
import { saveBankDetails } from "@/lib/actions/bank-details";
import { useConfirm } from "./use-confirm";
import { useActionPending } from "./use-action-pending";

function formatNaira(cents: number) {
  return `₦${(cents / 100).toLocaleString("en-NG")}`;
}

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
}: {
  action: (state: RegistryItemFormState, formData: FormData) => Promise<RegistryItemFormState>;
  initialValues?: ItemFormValues;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.success) onCancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 bg-ivory p-4 sm:grid-cols-2">
      {initialValues?.id && <input type="hidden" name="id" defaultValue={initialValues.id} />}

      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Name
        <input
          name="name"
          defaultValue={initialValues?.name}
          className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Category
        <input
          name="category"
          defaultValue={initialValues?.category}
          className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Price (₦)
        <input
          name="price"
          type="number"
          min={1}
          step="0.01"
          defaultValue={initialValues?.price}
          className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Image URL
        <input
          name="image"
          defaultValue={initialValues?.image}
          className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-xs text-foreground/60 sm:col-span-2">
        Buy link (optional)
        <input
          name="externalUrl"
          defaultValue={initialValues?.externalUrl ?? ""}
          className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>

      {state?.error && <p className="text-xs text-burnt-orange sm:col-span-2">{state.error}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <button
          type="button"
          onClick={onCancel}
          className="border border-olive/30 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-burnt-orange hover:text-burnt-orange"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="bg-burnt-orange px-4 py-2 text-xs font-medium text-ivory transition-colors hover:bg-burnt-orange-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
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
  const [state, formAction, pending] = useActionState(saveBankDetails, undefined);

  useEffect(() => {
    if (state?.success) onCancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 bg-ivory p-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Account name
        <input
          name="name"
          defaultValue={bankDetails.name}
          className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Bank
        <input
          name="bank"
          defaultValue={bankDetails.bank}
          className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Account number
        <input
          name="account"
          defaultValue={bankDetails.account}
          className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Routing number
        <input
          name="routing"
          defaultValue={bankDetails.routing}
          className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>

      {state?.error && <p className="text-xs text-burnt-orange sm:col-span-2">{state.error}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <button
          type="button"
          onClick={onCancel}
          className="border border-olive/30 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-burnt-orange hover:text-burnt-orange"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="bg-burnt-orange px-4 py-2 text-xs font-medium text-ivory transition-colors hover:bg-burnt-orange-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
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
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBank, setEditingBank] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { confirm, confirmDialog } = useConfirm();
  const { run, isPending } = useActionPending();

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Delete "${name}"?`,
      description: "This can't be undone.",
    });
    if (!ok) return;
    setDeleteError("");
    await run(id, "delete", async () => {
      const result = await deleteRegistryItem(id);
      if (result.error) setDeleteError(result.error);
    });
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-(family-name:--serif) text-2xl text-foreground">Bank Details</h2>
        {!editingBank && (
          <button
            type="button"
            onClick={() => setEditingBank(true)}
            className="text-xs text-foreground/60 hover:text-burnt-orange"
          >
            Edit
          </button>
        )}
      </div>

      {editingBank ? (
        <div className="mb-10">
          <BankDetailsForm bankDetails={bankDetails} onCancel={() => setEditingBank(false)} />
        </div>
      ) : (
        <div className="mb-10 grid grid-cols-2 gap-4 border border-olive/15 p-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-[10.5px] tracking-widest text-foreground/50 uppercase">Account name</p>
            <p className="mt-1 text-foreground">{bankDetails.name}</p>
          </div>
          <div>
            <p className="text-[10.5px] tracking-widest text-foreground/50 uppercase">Bank</p>
            <p className="mt-1 text-foreground">{bankDetails.bank}</p>
          </div>
          <div>
            <p className="text-[10.5px] tracking-widest text-foreground/50 uppercase">Account no.</p>
            <p className="mt-1 text-foreground">{bankDetails.account}</p>
          </div>
          <div>
            <p className="text-[10.5px] tracking-widest text-foreground/50 uppercase">Routing</p>
            <p className="mt-1 text-foreground">{bankDetails.routing}</p>
          </div>
        </div>
      )}

      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-(family-name:--serif) text-2xl text-foreground">Registry Items</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="bg-burnt-orange px-4 py-2 text-xs font-medium text-ivory hover:bg-burnt-orange-dark"
          >
            Add Item
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-5">
          <RegistryItemForm action={createRegistryItem} onCancel={() => setAdding(false)} submitLabel="Add Item" />
        </div>
      )}

      {deleteError && <p className="mb-3 text-xs text-burnt-orange">{deleteError}</p>}

      <div className="overflow-x-auto border border-olive/15">
        <table className="w-full min-w-150 text-left text-sm">
          <thead>
            <tr className="border-b border-olive/15 text-[11px] tracking-widest text-foreground/50 uppercase">
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Goal</th>
              <th className="px-4 py-3 font-medium">Raised</th>
              <th className="px-4 py-3 font-medium">Claimed by</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) =>
              editingId === item.id ? (
                <tr key={item.id} className="border-b border-olive/10 last:border-0">
                  <td colSpan={6} className="p-0">
                    <RegistryItemForm
                      action={updateRegistryItem}
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
                  </td>
                </tr>
              ) : (
                <tr key={item.id} className="border-b border-olive/10 last:border-0">
                  <td className="px-4 py-3 text-foreground">{item.name}</td>
                  <td className="px-4 py-3 text-foreground/70">{item.category}</td>
                  <td className="px-4 py-3 text-foreground/70">{formatNaira(item.priceCents)}</td>
                  <td className="px-4 py-3 text-foreground/70">
                    {formatNaira(sumContributions(item.contributions))}
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{item.claimedBy ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isPending(item.id)}
                      onClick={() => setEditingId(item.id)}
                      className="mr-3 text-xs text-foreground/60 hover:text-burnt-orange disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isPending(item.id)}
                      onClick={() => handleDelete(item.id, item.name)}
                      className="text-xs text-foreground/60 hover:text-burnt-orange disabled:opacity-60"
                    >
                      {isPending(item.id, "delete") ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      {confirmDialog}
    </div>
  );
}
