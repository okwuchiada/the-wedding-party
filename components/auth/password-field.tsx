"use client";

import { Check, Eye, EyeOff, X } from "lucide-react";
import { useId, useState } from "react";
import { passwordStrength } from "@/lib/password-rules";
import { authInputClass } from "./fields";

const METER_COLORS = ["", "bg-(--m-coral-deep)", "bg-(--m-gold)", "bg-(--m-emerald)", "bg-(--m-emerald)"];
const LABEL_COLORS = ["", "text-(--m-coral-deep)", "text-(--m-ink)", "text-(--m-emerald)", "text-(--m-emerald)"];

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
                score >= segment ? METER_COLORS[score] : "bg-(--m-mist)"
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
          <li key={rule.id} className={`flex items-center gap-1.5 ${rule.met ? "text-(--m-emerald)" : "text-(--m-ink)/60"}`}>
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
    <div className="flex flex-col gap-1.5 text-sm font-medium">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <input
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
          className={`${authInputClass} w-full pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-[6px] text-(--m-ink)/55 hover:text-(--m-ink) focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-(--m-ink)"
        >
          {visible ? <EyeOff aria-hidden size={18} /> : <Eye aria-hidden size={18} />}
        </button>
      </div>
      {hint && (
        <span id={hintId} className="text-xs font-normal text-(--m-ink)/55">
          {hint}
        </span>
      )}
      {showStrength && <StrengthMeter password={value} id={strengthId!} />}
    </div>
  );
}
