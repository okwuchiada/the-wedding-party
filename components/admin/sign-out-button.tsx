"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export default function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
