"use client";

import { useActionState, useState, useTransition } from "react";
import { useConfirm } from "@/components/admin/use-confirm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addStaff, resendStaffPassword, setStaffRole, type AddStaffState, type SuperActionResult } from "@/lib/actions/super";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, STAFF_ROLES, type Role, type StaffRole } from "@/lib/permissions";
import { ResultText } from "@/components/result-text";

export function AddStaffForm() {
  const [state, formAction, pending] = useActionState(addStaff, undefined);
  const [role, setRole] = useState<StaffRole>("SUPPORT");

  return (
    <Card className="rounded-md p-5 shadow-none">
      <form action={formAction} className="flex flex-col gap-4">
        <h2 className="font-(family-name:--m-display) text-2xl font-bold tracking-tight">Add a team member</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_12rem_auto]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="staff-email">Email</Label>
            <Input id="staff-email" name="email" type="email" required placeholder="name@example.com" className="h-auto py-2.5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="staff-role">Access level</Label>
            <Select name="role" value={role} onValueChange={(v) => setRole(v as StaffRole)}>
              <SelectTrigger id="staff-role" className="h-auto w-full py-2.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending} className="self-end">
            {pending ? "Adding…" : "Add"}
          </Button>
        </div>
        <p className="text-sm text-ink/70">{ROLE_DESCRIPTIONS[role]}</p>
        <p className="text-xs text-ink/60">
          New team members get an email with a temporary password (it looks like <span className="font-mono">Vowly-Temp-…</span> and
          lasts 7 days). They must choose their own password the first time they sign in.
        </p>
        <StaffResult state={state} />
      </form>
    </Card>
  );
}

/** The outcome of adding staff or resending a password, including a temporary password to pass on by hand if email failed. */
function StaffResult({ state }: { state: AddStaffState }) {
  const [copied, setCopied] = useState(false);
  if (!state) return null;
  return (
    <div className="flex flex-col gap-2">
      <ResultText error={state.error} className="text-sm" />
      {/* A temporary password to pass on by hand means the email didn't go: say so in coral. */}
      {state.message && (
        <p role="status" className={`text-sm ${state.tempPassword ? "text-coral-deep" : "text-emerald"}`}>
          {state.message}
        </p>
      )}
      {state.tempPassword && (
        <p className="flex flex-wrap items-center gap-2">
          <code className="rounded-sm bg-muted px-2.5 py-1.5 font-mono text-sm">{state.tempPassword}</code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(state.tempPassword!);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </p>
      )}
    </div>
  );
}

/** For staff still on a temporary password: issue and email a fresh one. */
export function ResendPasswordButton({ userId, email }: { userId: string; email: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AddStaffState>(undefined);
  const { confirm, confirmDialog } = useConfirm();

  return (
    <span className="inline-flex max-w-xs flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={async () => {
          if (!(await confirm({ title: `Send ${email} a new temporary password?`, description: "Their current temporary password stops working.", danger: false }))) return;
          startTransition(async () => setResult(await resendStaffPassword(userId)));
        }}
      >
        {pending ? "Sending…" : "Send new temporary password"}
      </Button>
      <StaffResult state={result} />
      {confirmDialog}
    </span>
  );
}

export function RoleSelect({ userId, role }: { userId: string; role: Role }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SuperActionResult | null>(null);
  const { confirm, confirmDialog } = useConfirm();

  const change = async (next: Role) => {
    const title =
      next === "USER" ? "Remove this person's staff access?" : `Change their access to ${ROLE_LABELS[next]}?`;
    if (!(await confirm({ title, danger: next === "USER" }))) return;
    startTransition(async () => setResult(await setStaffRole(userId, next)));
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className="inline-flex gap-1.5">
        {/* Controlled by the saved role, so a cancelled confirm leaves the old value showing. */}
        <Select value={role} disabled={pending} onValueChange={(v) => change(v as Role)}>
          <SelectTrigger size="sm" aria-label="Access level">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAFF_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={pending}
          onClick={() => change("USER")}
          className="py-1 border-coral/40 text-coral-deep hover:border-coral-deep hover:bg-coral-deep hover:text-white"
        >
          Remove access
        </Button>
      </span>
      <ResultText error={result?.error} message={result?.message} />
      {confirmDialog}
    </span>
  );
}
