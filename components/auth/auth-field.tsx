"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        {...input}
        id={id}
        aria-describedby={hintId}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onChange?.(e);
        }}
        className={authInputClass}
      />
      {hint && (
        <span id={hintId} className="text-xs text-ink/55">
          {hint}
        </span>
      )}
    </div>
  );
}
