"use client";

import { Clock } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

// Common start times for a ceremony or reception, offered as one-tap choices.
const QUICK_TIMES = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const MINUTES = ["00", "15", "30", "45"];

/** "16:00" → "4:00 PM" */
export function formatTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

const to24 = (hour12: number, minute: string, pm: boolean) =>
  `${String((hour12 % 12) + (pm ? 12 : 0)).padStart(2, "0")}:${minute}`;

/**
 * A time field in the same style as the date picker: a pop-up with common times
 * plus exact hour, minute and AM/PM. Submits HH:MM (24-hour) through a hidden
 * input named `name`.
 */
export default function TimePicker({
  name,
  value,
  onChange,
  labelledBy,
  placeholder = "Choose a time",
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  labelledBy?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const [h, m] = (value || "16:00").split(":");
  const hour24 = Number(h);
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const pm = hour24 >= 12;
  // Keep an unusual saved minute (e.g. :10) selectable.
  const minutes = MINUTES.includes(m) ? MINUTES : [...MINUTES, m].sort();

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) fieldRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    // Start on the selected quick time, or the first one.
    (panelRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]') ??
      panelRef.current?.querySelector<HTMLButtonElement>("button"))?.focus();
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const selectClass = "min-w-0 flex-1 border border-(--m-mist) bg-white px-2 py-1.5 text-sm font-semibold";

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        ref={fieldRef}
        type="button"
        id={id}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelledBy ? `${labelledBy} ${id}` : undefined}
        onClick={() => (open ? close(false) : setOpen(true))}
        className={`flex w-full items-center justify-between gap-3 rounded-[6px] border bg-white px-3.5 py-3 text-left text-base transition-shadow ${
          open ? "border-(--m-ink)/50 ring-3 ring-(--m-gold)/35" : "border-(--m-mist) hover:border-(--m-ink)/40"
        }`}
      >
        <span className={value ? "" : "text-(--m-ink)/50"}>{value ? formatTime(value) : placeholder}</span>
        <Clock aria-hidden size={19} className="shrink-0 text-(--m-ink)/60" />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Choose the wedding time"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            }
          }}
          className="absolute top-[calc(100%+8px)] left-0 z-30 grid w-[min(100%,20rem)] min-w-[17rem] gap-3 rounded-[8px] border border-(--m-mist) bg-white p-3.5 shadow-[0_24px_48px_-28px_rgb(22_32_74/0.55)]"
        >
          <p className="text-xs font-semibold text-(--m-ink)/60">Common times</p>
          <div className="grid grid-cols-3 gap-1.5">
            {QUICK_TIMES.map((t) => {
              const selected = t === value;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(t);
                    close();
                  }}
                  className={`rounded-full px-2 py-2 text-sm font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--m-ink) motion-reduce:transition-none ${
                    selected ? "bg-(--m-gold) font-bold text-(--m-ink)" : "bg-(--m-paper) hover:bg-(--m-mist)"
                  }`}
                >
                  {formatTime(t)}
                </button>
              );
            })}
          </div>

          <p className="border-t border-(--m-mist) pt-3 text-xs font-semibold text-(--m-ink)/60">Exact time</p>
          <div className="flex items-center gap-1.5">
            <select aria-label="Hour" value={hour12} onChange={(e) => onChange(to24(Number(e.target.value), m, pm))} className={selectClass}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((hr) => (
                <option key={hr} value={hr}>
                  {hr}
                </option>
              ))}
            </select>
            <span aria-hidden className="font-semibold">
              :
            </span>
            <select aria-label="Minute" value={m} onChange={(e) => onChange(to24(hour12, e.target.value, pm))} className={selectClass}>
              {minutes.map((min) => (
                <option key={min} value={min}>
                  {min}
                </option>
              ))}
            </select>
            <div role="group" aria-label="AM or PM" className="flex overflow-hidden rounded-full border border-(--m-mist)">
              {(["AM", "PM"] as const).map((half) => {
                const active = (half === "PM") === pm;
                return (
                  <button
                    key={half}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange(to24(hour12, m, half === "PM"))}
                    className={`px-2.5 py-1.5 text-xs font-semibold ${active ? "bg-(--m-ink) text-(--m-paper)" : "hover:bg-(--m-paper)"}`}
                  >
                    {half}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end border-t border-(--m-mist) pt-3">
            <button
              type="button"
              onClick={() => {
                if (!value) onChange(to24(hour12, m, pm));
                close();
              }}
              className="rounded-full bg-(--m-ink) px-3.5 py-1.5 text-sm font-medium text-(--m-paper) hover:bg-(--m-emerald)"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
