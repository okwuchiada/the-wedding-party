"use client";

import { useActionState, useState } from "react";
import { inviteMember, removeMember } from "@/lib/actions/members";
import { useActionPending } from "./use-action-pending";
import { useConfirm } from "./use-confirm";
import { useAdminWeddingId } from "./wedding-context";

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

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 rounded-[6px] bg-white p-4 sm:grid-cols-[1fr_auto_auto]">
      <input
        type="email"
        name="email"
        required
        placeholder="partner@example.com"
        className="border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
      />
      <select name="role" defaultValue="EDITOR" className="border border-(--m-mist) bg-white px-3 py-2 text-sm">
        <option value="EDITOR">Editor</option>
        <option value="OWNER">Owner</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-(--m-gold) px-4 py-2 text-xs font-semibold text-(--m-ink) hover:bg-(--m-ink) hover:text-(--m-paper) disabled:opacity-60"
      >
        {pending ? "Inviting…" : "Invite"}
      </button>
      {state?.error && <p className="text-xs text-burnt-orange sm:col-span-3">{state.error}</p>}
      {state?.message && <p className="text-xs text-olive sm:col-span-3">{state.message}</p>}
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
        <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">People</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Owners can invite and remove people. Editors can manage everything else.
        </p>
      </div>

      {isOwner && <InviteForm />}
      {error && <p className="text-xs text-burnt-orange">{error}</p>}

      <ul className="flex flex-col divide-y divide-(--m-mist) rounded-[6px] bg-white">
        {members.map((member) => (
          <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm text-foreground">
                {member.name || member.email}
                {member.isYou && <span className="text-foreground/50"> (you)</span>}
              </p>
              <p className="text-xs text-foreground/60">
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
                className="text-xs text-foreground/60 hover:text-burnt-orange disabled:opacity-50"
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
