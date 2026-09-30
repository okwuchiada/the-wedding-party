"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

export default function CopyRow({
  label,
  value,
  tone = "light",
}: {
  label: string;
  value: string;
  tone?: "light" | "dark";
}) {
  const [copied, setCopied] = useState(false);
  const isDark = tone === "dark";

  const copy = () => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 border-b py-1 ${
        isDark ? "border-ivory/20" : "border-olive/20"
      }`}
    >
      <span
        className={`text-[12px] uppercase tracking-[.14em] ${
          isDark ? "text-ivory/50" : "text-foreground/55"
        }`}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label.toLowerCase()}: ${value}`}
        className={`flex min-h-11 items-center gap-1.5 p-0 text-right text-[15px] ${
          isDark ? "text-ivory" : "text-foreground"
        }`}
      >
        {value}
        {copied ? (
          <span aria-live="polite" className="text-[12px] tracking-widest text-burnt-orange">
            COPIED
          </span>
        ) : (
          <Copy aria-hidden className="h-4 w-4 shrink-0 text-burnt-orange" />
        )}
      </button>
    </div>
  );
}
