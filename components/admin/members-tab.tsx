"use client";

import { useActionState, useState } from "react";
import { ResultText } from "@/components/result-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <form action={formAction} className="grid grid-cols-1 gap-3 rounded-md bg-white p-4 sm:grid-cols-[1fr_auto_auto]">
      <Input type="email" name="email" required aria-label="Email" placeholder="partner@example.com" className="h-auto py-2" />
      <Select name="role" defaultValue="EDITOR">
        <SelectTrigger aria-label="Role" className="h-auto py-2 data-[size=default]:h-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="EDITOR">Editor</SelectItem>
          <SelectItem value="OWNER">Owner</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Inviting…" : "Invite"}
      </Button>
      <ResultText error={state?.error} message={state?.message} className="sm:col-span-3" />
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
        <p className="mt-1 text-sm text-ink/60">
          Owners can invite and remove people. Editors can manage everything else.
        </p>
      </div>

      {isOwner && <InviteForm />}
      {error && <ResultText error={error} className="block" />}

      <ul className="flex flex-col divide-y divide-mist rounded-md bg-white">
        {members.map((member) => (
          <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm text-ink">
                {member.name || member.email}
                {member.isYou && <span className="text-ink/50"> (you)</span>}
              </p>
              <p className="text-xs text-ink/60">
                {member.name ? `${member.email} · ` : ""}
                {ROLE_LABELS[member.role]}
                {member.pendingInvite && " · invite pending"}
              </p>
            </div>
            {isOwner && (
              <Button
                type="button"
                variant="link"
                size="xs"
                disabled={isPending(member.id, "remove")}
                onClick={() => handleRemove(member)}
                className="px-0 font-normal text-ink/60 hover:text-coral-deep hover:no-underline disabled:opacity-50"
              >
                {isPending(member.id, "remove") ? "Removing…" : "Remove"}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
