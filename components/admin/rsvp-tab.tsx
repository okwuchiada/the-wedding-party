"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { RsvpView } from "@/lib/types";
import {
  createRsvpAdmin,
  deleteRsvp,
  importRsvps,
  sendRsvpConfirmation,
  updateRsvpAdmin,
  type AdminRsvpFormState,
  type ImportRsvpRow,
  type ImportRsvpsResult,
} from "@/lib/actions/rsvp";
import { readRsvpFile, RSVP_TEMPLATE_CSV } from "@/lib/rsvp-import";
import { Pagination, usePagination } from "./pagination";
import { useConfirm } from "./use-confirm";
import { useAdminWeddingId } from "./wedding-context";
import { useActionPending } from "./use-action-pending";

const inputClass = "border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none";

function RsvpForm({
  action,
  initialValues,
  onCancel,
  submitLabel,
}: {
  action: (state: AdminRsvpFormState, formData: FormData) => Promise<AdminRsvpFormState>;
  initialValues?: RsvpView;
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
        <input name="guestName" defaultValue={initialValues?.guestName} className={inputClass} />
      </label>

      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Email (optional)
        <input
          name="email"
          type="email"
          defaultValue={initialValues?.email}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Attending
        <select
          name="attending"
          defaultValue={initialValues ? (initialValues.attending ? "yes" : "no") : "yes"}
          className={inputClass}
        >
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-xs text-foreground/60 sm:col-span-2">
        Message (optional)
        <textarea
          rows={2}
          name="message"
          defaultValue={initialValues?.message ?? ""}
          className={`resize-none ${inputClass}`}
        />
      </label>

      {state?.error && <p className="text-xs text-burnt-orange sm:col-span-2">{state.error}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <button
          type="button"
          onClick={onCancel}
          className="border rounded-full border-(--m-ink)/25 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-(--m-ink)"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-(--m-gold) px-4 py-2 text-xs font-semibold text-(--m-ink) transition-colors hover:bg-(--m-ink) hover:text-(--m-paper) disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function RsvpImport({ onClose }: { onClose: () => void }) {
  const weddingId = useAdminWeddingId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRsvpRow[] | null>(null);
  const [fileError, setFileError] = useState("");
  const [result, setResult] = useState<ImportRsvpsResult | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setRows(null);
    setFileError("");
    setResult(null);
    if (!file) return;
    const parsed = await readRsvpFile(file);
    if (parsed.error) setFileError(parsed.error);
    else setRows(parsed.rows ?? null);
  };

  const handleImport = async () => {
    if (!rows) return;
    setImporting(true);
    try {
      const res = await importRsvps(weddingId, rows);
      setResult(res);
      if (!res.error) {
        setRows(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } finally {
      setImporting(false);
    }
  };

  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(RSVP_TEMPLATE_CSV)}`;

  return (
    <div className="flex flex-col gap-3 bg-ivory p-4">
      <p className="text-xs text-foreground/60">
        Upload a .csv or .xlsx file with columns <strong>Name</strong>, <strong>Attending</strong>{" "}
        (yes/no), and optionally <strong>Email</strong> and <strong>Message</strong>. Guests already on the list (matched by email, or by name when
        there&apos;s no email) are updated instead of duplicated.{" "}
        <a href={templateHref} download="rsvp-template.csv" className="text-burnt-orange underline">
          Download template
        </a>
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleFile}
        className={`${inputClass} file:mr-3 file:border-0 file:rounded-full file:bg-(--m-ink) file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ivory`}
      />

      {fileError && <p className="text-xs text-burnt-orange">{fileError}</p>}

      {rows && (
        <div>
          <p className="mb-2 text-xs text-foreground/70">
            {rows.length} {rows.length === 1 ? "guest" : "guests"} found. Preview:
          </p>
          <div className="max-h-60 overflow-auto border border-(--m-mist) rounded-[6px] bg-white">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-(--m-mist) text-xs text-foreground/50">
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Attending</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-(--m-mist) last:border-0">
                    <td className="px-3 py-1.5 text-foreground/50">{i + 2}</td>
                    <td className="px-3 py-1.5 text-foreground">{String(r.guestName)}</td>
                    <td className="px-3 py-1.5 text-foreground/70">{String(r.email) || "—"}</td>
                    <td className="px-3 py-1.5 text-foreground/70">
                      {r.attending === true ? "Yes" : r.attending === false ? "No" : `? (${String(r.attending)})`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result?.error && (
        <div className="text-xs text-burnt-orange">
          <p>{result.error}</p>
          {result.rowErrors && (
            <ul className="mt-1 list-disc pl-5">
              {result.rowErrors.slice(0, 20).map((e) => (
                <li key={e.row}>
                  Row {e.row}: {e.error}
                </li>
              ))}
              {result.rowErrors.length > 20 && <li>…and {result.rowErrors.length - 20} more</li>}
            </ul>
          )}
        </div>
      )}
      {result && !result.error && (
        <p className="text-xs text-olive">
          Imported: {result.created} added, {result.updated} updated.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="border rounded-full border-(--m-ink)/25 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-(--m-ink)"
        >
          {result && !result.error ? "Done" : "Cancel"}
        </button>
        <button
          type="button"
          disabled={!rows || importing}
          onClick={handleImport}
          className="rounded-full bg-(--m-gold) px-4 py-2 text-xs font-semibold text-(--m-ink) transition-colors hover:bg-(--m-ink) hover:text-(--m-paper) disabled:opacity-60"
        >
          {importing ? "Importing…" : "Import"}
        </button>
      </div>
    </div>
  );
}

function csvCell(value: string) {
  // Guest-entered text could start with a formula character; prefix it so
  // Excel/Sheets treat it as text instead of executing it.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

// Attending guests only, alphabetical, with a blank column to tick at the door.
function exportGuestList(rsvps: RsvpView[]) {
  const guests = rsvps
    .filter((r) => r.attending)
    .sort((a, b) => a.guestName.localeCompare(b.guestName));

  const lines = [
    ["#", "Name", "Email", "Message", "RSVP date", "Checked in"],
    ...guests.map((r, i) => [
      String(i + 1),
      r.guestName,
      r.email,
      r.message ?? "",
      r.dateSubmitted,
      "",
    ]),
  ].map((row) => row.map(csvCell).join(","));

  // BOM so Excel reads names with accents correctly.
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `guest-list-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RsvpTab({ rsvps }: { rsvps: RsvpView[] }) {
  const attendingGuests = rsvps
    .filter((r) => r.attending)
    .reduce((sum, r) => sum + r.guestCount, 0);
  const declinedCount = rsvps.filter((r) => !r.attending).length;
  const { page, pageSize, pageItems, total, setPage, setPageSize } = usePagination(rsvps);
  const weddingId = useAdminWeddingId();
  const [panel, setPanel] = useState<"add" | "import" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [sendError, setSendError] = useState("");
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
      const result = await deleteRsvp(weddingId, id);
      if (result.error) setDeleteError(result.error);
    });
  };

  const handleSend = async (id: string) => {
    setSendError("");
    await run(id, "send", async () => {
      const result = await sendRsvpConfirmation(weddingId, id);
      if (result.error) setSendError(result.error);
    });
  };

  return (
    <div>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="rounded-[6px] bg-white p-4 border border-(--m-mist)">
          <p className="text-xs text-foreground/55">Attending</p>
          <p className="mt-2 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">
            {attendingGuests} <span className="text-base text-foreground/40">/ 100</span>
          </p>
        </div>
        <div className="rounded-[6px] bg-white p-4 border border-(--m-mist)">
          <p className="text-xs text-foreground/55">Declined</p>
          <p className="mt-2 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">{declinedCount}</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">RSVPs</h2>
        {!panel && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPanel("import")}
              className="border rounded-full border-(--m-ink)/25 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-(--m-ink)"
            >
              Import CSV / Excel
            </button>
            <button
              type="button"
              onClick={() => setPanel("add")}
              className="rounded-full bg-(--m-gold) px-4 py-2 text-xs font-semibold text-(--m-ink) hover:bg-(--m-ink) hover:text-(--m-paper)"
            >
              Add RSVP
            </button>
          </div>
        )}
      </div>

      {panel === "add" && (
        <div className="mb-5">
          <RsvpForm action={createRsvpAdmin.bind(null, weddingId)} onCancel={() => setPanel(null)} submitLabel="Add RSVP" />
        </div>
      )}
      {panel === "import" && (
        <div className="mb-5">
          <RsvpImport onClose={() => setPanel(null)} />
        </div>
      )}

      {deleteError && <p className="mb-3 text-xs text-burnt-orange">{deleteError}</p>}
      {sendError && <p className="mb-3 text-xs text-burnt-orange">{sendError}</p>}

      {rsvps.length === 0 ? (
        <p className="text-sm text-foreground/60">No responses yet.</p>
      ) : (
        <>
        <div className="overflow-x-auto rounded-[6px] border border-(--m-mist) bg-white">
          <table className="w-full min-w-150 text-left text-sm">
            <thead>
              <tr className="border-b border-(--m-mist) text-xs text-foreground/50">
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Attending</th>
                <th className="px-4 py-3 font-medium">Guests</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Confirmation</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r) =>
                editingId === r.id ? (
                  <tr key={r.id} className="border-b border-(--m-mist) last:border-0">
                    <td colSpan={7} className="p-0">
                      <RsvpForm
                        action={updateRsvpAdmin.bind(null, weddingId)}
                        initialValues={r}
                        onCancel={() => setEditingId(null)}
                        submitLabel="Save Changes"
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id} className="border-b border-(--m-mist) last:border-0">
                    <td className="px-4 py-3 text-foreground">
                      {r.guestName}
                      {r.email && <span className="block text-xs text-foreground/50">{r.email}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium ${r.attending ? "text-olive" : "text-burnt-orange"}`}
                      >
                        {r.attending ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground/70">{r.attending ? r.guestCount : "—"}</td>
                    <td className="px-4 py-3 text-foreground/70">{r.message || "—"}</td>
                    <td className="px-4 py-3 text-foreground/70">{r.dateSubmitted}</td>
                    <td className="px-4 py-3">
                      {r.confirmationSentAt ? (
                        <span className="text-xs text-olive">Sent {r.confirmationSentAt}</span>
                      ) : !r.email ? (
                        <span className="text-xs text-foreground/50">No email</span>
                      ) : (
                        <button
                          type="button"
                          disabled={isPending(r.id)}
                          onClick={() => handleSend(r.id)}
                          className="rounded-full bg-(--m-gold) px-3 py-1.5 text-xs font-semibold text-(--m-ink) hover:bg-(--m-ink) hover:text-(--m-paper) disabled:opacity-60"
                        >
                          {isPending(r.id, "send") ? "Sending…" : "Send confirmation"}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={isPending(r.id)}
                        onClick={() => setEditingId(r.id)}
                        className="mr-3 text-xs text-foreground/60 hover:text-burnt-orange disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isPending(r.id)}
                        onClick={() => handleDelete(r.id, r.guestName)}
                        className="text-xs text-foreground/60 hover:text-burnt-orange disabled:opacity-60"
                      >
                        {isPending(r.id, "delete") ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </>
      )}

      {rsvps.some((r) => r.attending) && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => exportGuestList(rsvps)}
            className="border rounded-full border-(--m-ink)/25 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-(--m-ink)"
          >
            Export guest list (CSV)
          </button>
        </div>
      )}
      {confirmDialog}
    </div>
  );
}
