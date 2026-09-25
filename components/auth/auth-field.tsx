"use client";

import { useState } from "react";
import { authInputClass } from "./fields";

/**
 * A labelled text input that keeps its own value. React resets uncontrolled
 * inputs after a form action, which would wipe what people typed whenever the
 * server returns an error; state-held values survive that reset.
 */
export default function AuthField({
  label,
  hint,
  defaultValue,
  onChange,
  ...input
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [value, setValue] = useState(typeof defaultValue === "string" ? defaultValue : "");

  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <input
        {...input}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onChange?.(e);
        }}
        className={authInputClass}
      />
      {hint && <span className="text-xs font-normal text-(--m-ink)/55">{hint}</span>}
    </label>
  );
}
