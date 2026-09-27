"use client";

import { Check, Eye, EyeOff, X } from "lucide-react";
import { useId, useState } from "react";
import { passwordStrength } from "@/lib/password-rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authInputClass } from "./fields";

const METER_COLORS = ["", "bg-coral-deep", "bg-gold", "bg-emerald", "bg-emerald"];
const LABEL_COLORS = ["", "text-coral-deep", "text-ink", "text-emerald", "text-emerald"];

function StrengthMeter({ password, id }: { password: string; id: string }) {
  const { score, label, rules } = passwordStrength(password);

  return (
    <div id={id} className="flex flex-col gap-2 font-normal">
      <div className="flex items-center gap-3">
        <div aria-hidden className="flex flex-1 gap-1">
          {[1, 2, 3, 4].map((segment) => (
            <span
              key={segment}
              className={`h-1.5 flex-1 rounded-full transition-colors motion-reduce:transition-none ${
                score >= segment ? METER_COLORS[score] : "bg-mist"
              }`}
            />
          ))}
        </div>
        <span aria-live="polite" className={`min-w-24 text-right text-xs font-semibold ${LABEL_COLORS[score]}`}>
          {label && `Strength: ${label}`}
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
        {rules.map((rule) => (
          <li key={rule.id} className={`flex items-center gap-1.5 ${rule.met ? "text-emerald" : "text-ink/60"}`}>
            {rule.met ? <Check aria-hidden size={14} strokeWidth={2.5} /> : <X aria-hidden size={14} />}
            <span>
              {rule.label}
              <span className="sr-only">{rule.met ? " (done)" : " (needed)"}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A password input with a button to show or hide what's been typed. */
export default function PasswordField({
  label,
  hint,
  showStrength = false,
  onChange,
  ...input
}: {
  label: string;
  hint?: string;
  /** Show the strength meter and requirement checklist (for creating a password). */
  showStrength?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const strengthId = showStrength ? `${id}-strength` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          {...input}
          id={id}
          // Held in state so React's post-submit form reset can't clear it.
          value={value}
          type={visible ? "text" : "password"}
          aria-describedby={[hintId, strengthId].filter(Boolean).join(" ") || undefined}
          onChange={(e) => {
            setValue(e.target.value);
            onChange?.(e);
          }}
          // Room for the toggle so text never runs under it.
          className={`${authInputClass} pr-12`}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute inset-y-0 right-0 h-full w-11 rounded-l-none rounded-r-md text-ink/55 hover:bg-transparent hover:text-ink"
        >
          {visible ? <EyeOff aria-hidden className="size-[18px]" /> : <Eye aria-hidden className="size-[18px]" />}
        </Button>
      </div>
      {hint && (
        <span id={hintId} className="text-xs text-ink/55">
          {hint}
        </span>
      )}
      {showStrength && <StrengthMeter password={value} id={strengthId!} />}
    </div>
  );
}
