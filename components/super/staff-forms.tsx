"use client";

import { useActionState, useState, useTransition } from "react";
import { addStaff, setStaffRole, type SuperActionResult } from "@/lib/actions/super";
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
      {state?.error && <p className="text-sm text-(--m-coral-deep)">{state.error}</p>}
      {state?.message && <p className="text-sm text-(--m-emerald)">{state.message}</p>}
    </form>
  );
}

export function RoleSelect({ userId, role }: { userId: string; role: Role }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SuperActionResult | null>(null);

  const change = (next: Role) => {
    const text =
      next === "USER" ? "Remove this person's staff access?" : `Change their access to ${ROLE_LABELS[next]}?`;
    if (!window.confirm(text)) return;
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
    </span>
  );
}
