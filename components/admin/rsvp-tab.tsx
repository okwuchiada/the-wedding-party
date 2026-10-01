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
import { guestListCsv } from "@/lib/guest-list-csv";
import { readRsvpFile, RSVP_TEMPLATE_CSV } from "@/lib/rsvp-import";
import { Pagination, usePagination } from "./pagination";
import { useConfirm } from "./use-confirm";
import { useAdminWeddingId } from "./wedding-context";
import { useActionPending } from "./use-action-pending";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FIELD, FIELD_LABEL, FILE_INPUT, TEXT_ACTION } from "./form-styles";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    <form action={formAction} className="grid grid-cols-1 gap-3 bg-paper p-4 sm:grid-cols-2">
      {initialValues?.id && <input type="hidden" name="id" defaultValue={initialValues.id} />}

      <Label className={FIELD_LABEL}>
        Name
        <Input name="guestName" defaultValue={initialValues?.guestName} className={FIELD} />
      </Label>

      <Label className={FIELD_LABEL}>
        Email (optional)
        <Input name="email" type="email" defaultValue={initialValues?.email} className={FIELD} />
      </Label>

      <Label className={FIELD_LABEL}>
        Attending
        <Select name="attending" defaultValue={initialValues ? (initialValues.attending ? "yes" : "no") : "yes"}>
          <SelectTrigger className={cn(FIELD, "w-full data-[size=default]:h-auto")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </Label>

      <Label className={cn(FIELD_LABEL, "sm:col-span-2")}>
        Message (optional)
        <Textarea rows={2} name="message" defaultValue={initialValues?.message ?? ""} className={cn(FIELD, "field-sizing-fixed resize-none")} />
      </Label>

      {state?.error && <p className="text-xs text-destructive sm:col-span-2">{state.error}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
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
    <div className="flex flex-col gap-3 bg-paper p-4">
      <p className="text-xs text-ink/60">
        Upload a .csv or .xlsx file with columns <strong>Name</strong>, <strong>Attending</strong>{" "}
        (yes/no), and optionally <strong>Email</strong> and <strong>Message</strong>. Guests already on the list (matched by email, or by name when
        there&apos;s no email) are updated instead of duplicated.{" "}
        <a href={templateHref} download="rsvp-template.csv" className="text-destructive underline">
          Download template
        </a>
      </p>

      <Input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleFile}
        className={cn(FIELD, FILE_INPUT)}
      />

      {fileError && <p className="text-xs text-destructive">{fileError}</p>}

      {rows && (
        <div>
          <p className="mb-2 text-xs text-ink/70">
            {rows.length} {rows.length === 1 ? "guest" : "guests"} found. Preview:
          </p>
          <div className="max-h-60 overflow-auto border border-border rounded-[6px] bg-white">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-3 py-2 text-ink/50">Row</TableHead>
                  <TableHead className="px-3 py-2 text-ink/50">Name</TableHead>
                  <TableHead className="px-3 py-2 text-ink/50">Email</TableHead>
                  <TableHead className="px-3 py-2 text-ink/50">Attending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-3 py-1.5 text-ink/50">{i + 2}</TableCell>
                    <TableCell className="px-3 py-1.5 text-ink">{String(r.guestName)}</TableCell>
                    <TableCell className="px-3 py-1.5 text-ink/70">{String(r.email) || "—"}</TableCell>
                    <TableCell className="px-3 py-1.5 text-ink/70">
                      {r.attending === true ? "Yes" : r.attending === false ? "No" : `? (${String(r.attending)})`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {result?.error && (
        <div className="text-xs text-destructive">
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
        <p className="text-xs text-emerald">
          Imported: {result.created} added, {result.updated} updated.
        </p>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          {result && !result.error ? "Done" : "Cancel"}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!rows || importing}
          onClick={handleImport}
        >
          {importing ? "Importing…" : "Import"}
        </Button>
      </div>
    </div>
  );
}

// Attending guests only, alphabetical, with a blank column to tick at the door.
function exportGuestList(rsvps: RsvpView[]) {
  // BOM so Excel reads names with accents correctly.
  const blob = new Blob(["﻿" + guestListCsv(rsvps)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `guest-list-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RsvpTab({ rsvps, capacity }: { rsvps: RsvpView[]; capacity: number }) {
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
        <Card className="gap-0 rounded-md p-4 shadow-none">
          <p className="text-xs text-muted-foreground">Attending</p>
          <p className="mt-2 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-ink">
            {attendingGuests} <span className="text-base text-muted-foreground">/ {capacity}</span>
          </p>
        </Card>
        <Card className="gap-0 rounded-md p-4 shadow-none">
          <p className="text-xs text-muted-foreground">Declined</p>
          <p className="mt-2 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-ink">{declinedCount}</p>
        </Card>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-ink">RSVPs</h2>
        {!panel && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPanel("import")}
            >
              Import CSV / Excel
            </Button>
            <Button type="button" size="sm" onClick={() => setPanel("add")}>
              Add RSVP
            </Button>
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

      {deleteError && <p className="mb-3 text-xs text-destructive">{deleteError}</p>}
      {sendError && <p className="mb-3 text-xs text-destructive">{sendError}</p>}

      {rsvps.length === 0 ? (
        <p className="text-sm text-ink/60">No responses yet.</p>
      ) : (
        <>
        <div className="overflow-hidden rounded-md border border-mist bg-white">
          <Table className="min-w-150">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 text-ink/50">Guest</TableHead>
                <TableHead className="px-4 py-3 text-ink/50">Attending</TableHead>
                <TableHead className="px-4 py-3 text-ink/50">Guests</TableHead>
                <TableHead className="px-4 py-3 text-ink/50">Message</TableHead>
                <TableHead className="px-4 py-3 text-ink/50">Submitted</TableHead>
                <TableHead className="px-4 py-3 text-ink/50">Confirmation</TableHead>
                <TableHead className="px-4 py-3 text-ink/50">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((r) =>
                editingId === r.id ? (
                  <TableRow key={r.id}>
                    <TableCell colSpan={7} className="p-0">
                      <RsvpForm
                        action={updateRsvpAdmin.bind(null, weddingId)}
                        initialValues={r}
                        onCancel={() => setEditingId(null)}
                        submitLabel="Save changes"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={r.id}>
                    <TableCell className="px-4 py-3 text-ink">
                      {r.guestName}
                      {r.email && <span className="block text-xs text-ink/50">{r.email}</span>}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span
                        className={`text-xs font-medium ${r.attending ? "text-emerald" : "text-destructive"}`}
                      >
                        {r.attending ? "Yes" : "No"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-ink/70">{r.attending ? r.guestCount : "—"}</TableCell>
                    <TableCell className="px-4 py-3 text-ink/70">{r.message || "—"}</TableCell>
                    <TableCell className="px-4 py-3 text-ink/70">{r.dateSubmitted}</TableCell>
                    <TableCell className="px-4 py-3">
                      {r.confirmationSentAt ? (
                        <span className="text-xs text-emerald">Sent {r.confirmationSentAt}</span>
                      ) : !r.email ? (
                        <span className="text-xs text-ink/50">No email</span>
                      ) : (
                        <Button
                          type="button"
                          size="xs"
                          disabled={isPending(r.id)}
                          onClick={() => handleSend(r.id)}
                        >
                          {isPending(r.id, "send") ? "Sending…" : "Send confirmation"}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Button
                        type="button"
                        variant="link"
                        size="xs"
                        disabled={isPending(r.id)}
                        onClick={() => setEditingId(r.id)}
                        className={cn(TEXT_ACTION, "mr-3")}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        size="xs"
                        disabled={isPending(r.id)}
                        onClick={() => handleDelete(r.id, r.guestName)}
                        className={TEXT_ACTION}
                      >
                        {isPending(r.id, "delete") ? "Deleting…" : "Delete"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </>
      )}

      {rsvps.some((r) => r.attending) && (
        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => exportGuestList(rsvps)}
          >
            Export guest list (CSV)
          </Button>
        </div>
      )}
      {confirmDialog}
    </div>
  );
}
