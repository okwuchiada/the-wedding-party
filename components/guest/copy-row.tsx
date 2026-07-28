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
      className={`flex items-baseline justify-between gap-3 border-b py-2 ${
        isDark ? "border-ivory/20" : "border-olive/20"
      }`}
    >
      <span
        className={`text-[10.5px] uppercase tracking-[.16em] ${
          isDark ? "text-ivory/50" : "text-foreground/55"
        }`}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={copy}
        title="Copy"
        className={`flex items-center gap-1.5 p-0 text-right text-[13.5px] ${
          isDark ? "text-ivory" : "text-foreground"
        }`}
      >
        {value}
        {copied ? (
          <span className="text-[10.5px] tracking-widest text-burnt-orange">
            COPIED
          </span>
        ) : (
          <Copy className="h-3.5 w-3.5 shrink-0 text-burnt-orange" />
        )}
      </button>
    </div>
  );
}
