// Form pieces for the auth pages, in the marketing palette (components/marketing/shell.tsx).

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function AuthHeading({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="mb-7">
      <h1 className="font-(family-name:--m-display) text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">{title}</h1>
      {intro && <p className="mt-2 leading-relaxed text-ink/70">{intro}</p>}
    </div>
  );
}

/** The auth pages use roomier fields than the dashboard. */
export const authInputClass = "h-auto px-3.5 py-3 text-base md:text-base placeholder:text-ink/35";

export function AuthSubmit({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <Button type="submit" size="lg" disabled={pending} className="mt-1 py-3.5">
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function AuthMessage({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return (
    <Alert variant={error ? "destructive" : "success"} role={error ? "alert" : "status"}>
      <AlertDescription>{error ?? message}</AlertDescription>
    </Alert>
  );
}

export const authLinkClass = "font-medium underline decoration-ink/25 underline-offset-4 hover:decoration-ink";
