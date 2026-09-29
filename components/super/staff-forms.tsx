"use client";

import { useActionState, useState, useTransition } from "react";
import { useConfirm } from "@/components/admin/use-confirm";
import { addStaff, resendStaffPassword, setStaffRole, type AddStaffState, type SuperActionResult } from "@/lib/actions/super";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, STAFF_ROLES, type Role, type StaffRole } from "@/lib/permissions";

const field = "border border-(--m-mist) bg-white px-3 py-2.5 text-sm";

export function AddStaffForm() {
  const [state, formAction, pending] = useActionState(addStaff, undefined);
  const [role, setRole] = useState<StaffRole>("SUPPORT");

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-[6px] border border-(--m-mist) bg-white p-5">
      <h2 className="font-(family-name:--m-display) text-2xl font-bold tracking-tight">Add a team member</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_12rem_auto]">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Email
          <input name="email" type="email" required placeholder="name@example.com" className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Access level
          <select name="role" value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={field}>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="self-end rounded-full bg-(--m-gold) px-5 py-2.5 text-sm font-semibold text-(--m-ink) hover:bg-(--m-ink) hover:text-(--m-paper) disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      <p className="text-sm text-(--m-ink)/70">{ROLE_DESCRIPTIONS[role]}</p>
      <p className="text-xs text-(--m-ink)/60">
        New team members get an email with a temporary password (it looks like <span className="font-mono">Vowly-Temp-…</span> and
        lasts 7 days). They must choose their own password the first time they sign in.
      </p>
      <StaffResult state={state} />
    </form>
  );
}

/** The outcome of adding staff or resending a password, including a temporary password to pass on by hand if email failed. */
function StaffResult({ state }: { state: AddStaffState }) {
  const [copied, setCopied] = useState(false);
  if (!state) return null;
  return (
    <div className="flex flex-col gap-2">
      {state.error && <p className="text-sm text-(--m-coral-deep)">{state.error}</p>}
      {state.message && <p className={`text-sm ${state.tempPassword ? "text-(--m-coral-deep)" : "text-(--m-emerald)"}`}>{state.message}</p>}
      {state.tempPassword && (
        <p className="flex flex-wrap items-center gap-2">
          <code className="rounded-[4px] bg-(--m-paper) px-2.5 py-1.5 font-mono text-sm">{state.tempPassword}</code>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(state.tempPassword!);
              setCopied(true);
            }}
            className="rounded-full border border-(--m-ink)/25 px-3 py-1 text-xs font-medium hover:border-(--m-ink)"
          >
            {copied ? "Copied" : "Copy"}
          </button>
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
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!(await confirm({ title: `Send ${email} a new temporary password?`, description: "Their current temporary password stops working.", danger: false }))) return;
          startTransition(async () => setResult(await resendStaffPassword(userId)));
        }}
        className="rounded-full border border-(--m-ink)/25 px-3 py-1 text-xs font-medium hover:border-(--m-ink) disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send new temporary password"}
      </button>
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
        <select
          aria-label="Access level"
          value={role}
          disabled={pending}
          onChange={(e) => change(e.target.value as Role)}
          className="border border-(--m-mist) bg-white px-2 py-1.5 text-sm"
        >
          {STAFF_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending}
          onClick={() => change("USER")}
          className="rounded-full border border-(--m-coral)/40 px-3 py-1 text-xs font-medium text-(--m-coral-deep) hover:bg-(--m-coral-deep) hover:text-white disabled:opacity-50"
        >
          Remove access
        </button>
      </span>
      {result?.error && <span className="text-xs text-(--m-coral-deep)">{result.error}</span>}
      {result?.message && <span className="text-xs text-(--m-emerald)">{result.message}</span>}
      {confirmDialog}
    </span>
  );
}
