import { useId } from "react";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { CountryCodeInput, PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";

type Meta = { label: React.ReactNode; hint?: string; error?: string };

/** Label above, hint or error below, all wired to the control with aria attributes. */
export function Field({ label, hint, error, htmlFor, children }: Meta & { htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[13px] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[13px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, meta: Meta) {
  return meta.error ? `${id}-error` : meta.hint ? `${id}-hint` : undefined;
}

/** A labelled shadcn Input. */
export function TextInput({ label, hint, error, id, ...props }: Meta & React.ComponentProps<typeof Input>) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId}>
      <Input id={fieldId} aria-invalid={error ? true : undefined} aria-describedby={describedBy(fieldId, { label, hint, error })} {...props} />
    </Field>
  );
}

/** A labelled shadcn Select (see FormSelect) that submits `name` with the form. */
export function SelectInput({ label, hint, error, id, ...props }: Meta & Omit<React.ComponentProps<typeof FormSelect>, "aria-invalid" | "aria-describedby">) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId}>
      <FormSelect id={fieldId} aria-invalid={error ? true : undefined} aria-describedby={describedBy(fieldId, { label, hint, error })} {...props} />
    </Field>
  );
}

/** A labelled shadcn Textarea. */
export function TextArea({ label, hint, error, id, ...props }: Meta & React.ComponentProps<typeof Textarea>) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId}>
      <Textarea id={fieldId} aria-invalid={error ? true : undefined} aria-describedby={describedBy(fieldId, { label, hint, error })} {...props} />
    </Field>
  );
}

/** A labelled MoneyInput; the currency goes in the label for screen readers, the symbol shows in the field. */
export function MoneyField({ label, hint, error, id, symbol, ...props }: Meta & React.ComponentProps<typeof MoneyInput>) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId}>
      <MoneyInput id={fieldId} symbol={symbol} aria-invalid={error ? true : undefined} aria-describedby={describedBy(fieldId, { label, hint, error })} {...props} />
    </Field>
  );
}

/** A labelled PhoneInput. */
export function PhoneField({ label, hint, error, id, ...props }: Meta & React.ComponentProps<typeof PhoneInput>) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId}>
      <PhoneInput id={fieldId} aria-invalid={error ? true : undefined} aria-describedby={describedBy(fieldId, { label, hint, error })} {...props} />
    </Field>
  );
}

/** A labelled CountryCodeInput ("+" shown in the field). */
export function CountryCodeField({ label, hint, error, id, ...props }: Meta & React.ComponentProps<typeof CountryCodeInput>) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId}>
      <CountryCodeInput id={fieldId} aria-invalid={error ? true : undefined} aria-describedby={describedBy(fieldId, { label, hint, error })} {...props} />
    </Field>
  );
}
