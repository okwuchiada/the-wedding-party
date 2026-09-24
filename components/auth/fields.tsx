// Form pieces for the auth pages, in the marketing palette (components/marketing/shell.tsx).

export function AuthHeading({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="mb-7">
      <h1 className="font-(family-name:--m-display) text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">{title}</h1>
      {intro && <p className="mt-2 leading-relaxed text-(--m-ink)/70">{intro}</p>}
    </div>
  );
}

export const authInputClass =
  "rounded-[6px] border border-(--m-mist) bg-white px-3.5 py-3 text-base text-(--m-ink) outline-none transition-shadow placeholder:text-(--m-ink)/35 focus:border-(--m-ink)/50 focus:ring-3 focus:ring-(--m-gold)/35";

export function AuthField({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <input {...input} className={authInputClass} />
      {hint && <span className="text-xs font-normal text-(--m-ink)/55">{hint}</span>}
    </label>
  );
}

export function AuthSubmit({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 rounded-full bg-(--m-gold) px-6 py-3.5 text-sm font-semibold text-(--m-ink) transition-colors hover:bg-(--m-ink) hover:text-(--m-paper) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--m-ink) disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function AuthMessage({ error, message }: { error?: string; message?: string }) {
  if (error) {
    return (
      <p role="alert" className="rounded-[6px] bg-(--m-coral)/10 px-3 py-2 text-sm text-(--m-coral-deep)">
        {error}
      </p>
    );
  }
  if (message) {
    return (
      <p role="status" className="rounded-[6px] bg-(--m-emerald)/10 px-3 py-2 text-sm text-(--m-emerald)">
        {message}
      </p>
    );
  }
  return null;
}

export const authLinkClass = "font-medium underline decoration-(--m-ink)/25 underline-offset-4 hover:decoration-(--m-ink)";
