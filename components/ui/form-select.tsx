"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: React.ReactNode };

// Radix can't give an item the empty value, so "Not set" uses this and submits "".
const NONE = "__none__";

/**
 * A shadcn Select that works inside a plain form: it submits `name` like a
 * native <select>. Controlled (`value` + `onValueChange`) or not (`defaultValue`).
 * `emptyLabel` adds a choice that submits "" (for optional fields).
 */
export function FormSelect({
  name,
  value,
  defaultValue = "",
  onValueChange,
  options,
  placeholder = "Choose…",
  emptyLabel,
  required,
  disabled,
  id,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  emptyLabel?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-label"?: string;
}) {
  const [own, setOwn] = useState(defaultValue);
  const current = value ?? own;
  const change = (next: string) => {
    const real = next === NONE ? "" : next;
    if (value === undefined) setOwn(real);
    onValueChange?.(real);
  };

  return (
    <>
      {name && <input type="hidden" name={name} value={current} />}
      <Select value={current === "" ? (emptyLabel ? NONE : "") : current} onValueChange={change} required={required} disabled={disabled}>
        <SelectTrigger
          id={id}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          aria-label={ariaLabel}
          className={cn("h-9 w-full bg-white", className)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {emptyLabel && <SelectItem value={NONE}>{emptyLabel}</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
