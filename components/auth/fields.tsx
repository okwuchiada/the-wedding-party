export function AuthHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-olive">{eyebrow}</p>
      <h1 className="mb-6 font-(family-name:--serif) text-2xl text-foreground">{title}</h1>
    </>
  );
}

export function AuthField({
  label,
  ...input
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
      {label}
      <input
        {...input}
        className="border border-olive/20 bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-olive"
      />
    </label>
  );
}

export function AuthSubmit({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-burnt-orange px-6 py-2.5 text-xs font-medium text-ivory transition-colors hover:bg-burnt-orange-dark disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function AuthMessage({ error, message }: { error?: string; message?: string }) {
  if (error) return <p className="text-xs text-burnt-orange">{error}</p>;
  if (message) return <p className="text-xs text-olive">{message}</p>;
  return null;
}
