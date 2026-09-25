"use client";

import { useActionState, useState } from "react";
import { inviteMember, removeMember } from "@/lib/actions/members";
import { useActionPending } from "./use-action-pending";
import { useConfirm } from "./use-confirm";
import { useAdminWeddingId } from "./wedding-context";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { useSuccessToast } from "@/components/ui/toast";

export type MemberView = {
  id: string;
  email: string;
  name: string | null;
  role: "OWNER" | "EDITOR";
  pendingInvite: boolean;
  isYou: boolean;
};

const ROLE_LABELS = { OWNER: "Owner", EDITOR: "Editor" } as const;

function InviteForm() {
  const weddingId = useAdminWeddingId();
  const [state, formAction, pending] = useActionState(inviteMember.bind(null, weddingId), undefined);
  useSuccessToast(state, "Invite sent");

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 rounded-[6px] bg-surface p-4 sm:grid-cols-[1fr_auto_auto]">
      <input
        type="email"
        name="email"
        required
        placeholder="partner@example.com"
        className={`${inputClass}`}
      />
      <select name="role" defaultValue="EDITOR" className={`${inputClass} w-auto`}>
        <option value="EDITOR">Editor</option>
        <option value="OWNER">Owner</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className={buttonClass("primary", "sm")}
      >
        {pending ? "Inviting…" : "Invite"}
      </button>
      {state?.error && <p className="text-[13px] text-danger sm:col-span-3">{state.error}</p>}
    </form>
  );
}

export default function MembersTab({ members, isOwner }: { members: MemberView[]; isOwner: boolean }) {
  const weddingId = useAdminWeddingId();
  const [error, setError] = useState("");
  const { confirm, confirmDialog } = useConfirm();
  const { run, isPending } = useActionPending();

  const handleRemove = async (member: MemberView) => {
    const ok = await confirm({
      title: "Remove access?",
      description: `${member.email} will no longer be able to manage this wedding.`,
      danger: true,
      confirmLabel: "Remove",
    });
    if (!ok) return;
    await run(member.id, "remove", async () => {
      const result = await removeMember(weddingId, member.id);
      setError(result.error ?? "");
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {confirmDialog}
      <div>
        <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-ink">People</h2>
        <p className="mt-1 text-sm text-muted">
          Owners can invite and remove people. Editors can manage everything else.
        </p>
      </div>

      {isOwner && <InviteForm />}
      {error && <p className="text-[13px] text-danger">{error}</p>}

      <ul className="flex flex-col divide-y divide-line rounded-[6px] bg-surface">
        {members.map((member) => (
          <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm text-ink">
                {member.name || member.email}
                {member.isYou && <span className="text-muted"> (you)</span>}
              </p>
              <p className="text-xs text-muted">
                {member.name ? `${member.email} · ` : ""}
                {ROLE_LABELS[member.role]}
                {member.pendingInvite && " · invite pending"}
              </p>
            </div>
            {isOwner && (
              <button
                type="button"
                disabled={isPending(member.id, "remove")}
                onClick={() => handleRemove(member)}
                className={buttonClass("text", "sm")}
              >
                {isPending(member.id, "remove") ? "Removing…" : "Remove"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
