import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export const inputClass =
  "w-full rounded-[6px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/70 transition-shadow focus-visible:border-ink/50 focus-visible:ring-3 focus-visible:ring-action/35 focus-visible:outline-none aria-invalid:border-danger";

type Meta = { label: string; hint?: string; error?: string };

/** Label above, hint or error below, all wired to the control with aria attributes. */
export function Field({ label, hint, error, htmlFor, children }: Meta & { htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, meta: Meta) {
  return meta.error ? `${id}-error` : meta.hint ? `${id}-hint` : undefined;
}

export function TextInput({ label, hint, error, id, className = "", ...props }: Meta & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId}>
      <input id={fieldId} aria-invalid={error ? true : undefined} aria-describedby={describedBy(fieldId, { label, hint, error })} className={`${inputClass} ${className}`} {...props} />
    </Field>
  );
}

export function SelectInput({ label, hint, error, id, className = "", children, ...props }: Meta & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId}>
      <select id={fieldId} aria-invalid={error ? true : undefined} aria-describedby={describedBy(fieldId, { label, hint, error })} className={`${inputClass} ${className}`} {...props}>
        {children}
      </select>
    </Field>
  );
}

export function TextArea({ label, hint, error, id, className = "", ...props }: Meta & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId}>
      <textarea id={fieldId} aria-invalid={error ? true : undefined} aria-describedby={describedBy(fieldId, { label, hint, error })} className={`${inputClass} ${className}`} {...props} />
    </Field>
  );
}
