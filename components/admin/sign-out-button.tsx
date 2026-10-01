"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";
import { useConfirm } from "./use-confirm";

/** Signs out after asking first, so a stray tap doesn't end the session. */
export default function SignOutButton() {
  const formRef = useRef<HTMLFormElement>(null);
  const [leaving, setLeaving] = useState(false);
  const { confirm, confirmDialog } = useConfirm();

  const ask = async () => {
    const ok = await confirm({
      title: "Sign out?",
      description: "You'll need your email and password to sign back in.",
      confirmLabel: "Sign out",
      cancelLabel: "Stay signed in",
      danger: false,
    });
    if (!ok) return;
    setLeaving(true);
    formRef.current?.requestSubmit();
  };

  return (
    <form ref={formRef} action={logout}>
      <Button type="button" variant="outline" size="sm" className="text-sm" disabled={leaving} onClick={ask}>
        {leaving ? "Signing out…" : "Sign out"}
      </Button>
      {confirmDialog}
    </form>
  );
}
