"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { holidayOn } from "@/lib/ng-holidays";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_MS = 864e5;

// Dates are handled as YYYY-MM-DD strings and UTC Date objects so time zones never shift a day.
const parse = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
const daysIn = (y: number, m: number) => utc(y, m + 1, 0).getUTCDate();
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);
const isWeekend = (d: Date) => d.getUTCDay() === 0 || d.getUTCDay() === 6;
const longDate = (d: Date) => `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const shortDate = (d: Date) =>
  `${DAYS[d.getUTCDay()].slice(0, 3)}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`;

function localToday() {
  const now = new Date();
  return utc(now.getFullYear(), now.getMonth(), now.getDate());
}

/** "176 days to go", plus a note when the date is on or next to a public holiday. */
function dateNote(value: string, today: Date) {
  if (!value) return null;
  const d = parse(value);
  const days = Math.round((d.getTime() - today.getTime()) / DAY_MS);
  const countdown =
    days === 0
      ? "That's today"
      : days === 1
        ? "1 day to go"
        : days > 0
          ? `${days} days to go`
          : days === -1
            ? "Married yesterday"
            : `Married ${-days} days ago`;
  const on = holidayOn(value);
  const near = on ?? holidayOn(iso(addDays(d, -1))) ?? holidayOn(iso(addDays(d, 1)));
  const holiday = on
    ? `On ${on}: guests may travel or have family plans.`
    : near
      ? `Next to ${near}: guests may travel or have family plans.`
      : null;
  return { countdown, holiday };
}

/**
 * A date field that opens a month calendar with month and year menus. Past days
 * are off, weekends are tinted and Nigerian public holidays are marked. Submits
 * the date as YYYY-MM-DD through a hidden input named `name`.
 */
export default function DatePicker({
  name,
  value,
  onChange,
  labelledBy,
  placeholder = "Choose a date",
  yearsAhead = 5,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  labelledBy?: string;
  placeholder?: string;
  yearsAhead?: number;
}) {
  const [today] = useState(localToday);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ y: today.getUTCFullYear(), m: today.getUTCMonth() });
  const [focused, setFocused] = useState<Date>(today);
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const noteId = `${id}-note`;
  const maxYear = today.getUTCFullYear() + yearsAhead;
  const maxDate = utc(maxYear, 11, 31);
  const selected = value ? parse(value) : null;
  const note = dateNote(value, today);

  const clamp = (d: Date) => (d < today ? today : d > maxDate ? maxDate : d);
  const showMonthOf = (d: Date) => setView({ y: d.getUTCFullYear(), m: d.getUTCMonth() });

  const openPicker = () => {
    const start = clamp(selected ?? today);
    setFocused(start);
    showMonthOf(start);
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) fieldRef.current?.focus();
  };
  const pick = (d: Date) => {
    onChange(iso(d));
    close();
  };

  // Close when clicking outside the field and calendar.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // After opening or a keyboard move, put focus on the active day.
  const focusedKey = iso(focused);
  useEffect(() => {
    if (open) gridRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
  }, [open, focusedKey]);

  const onGridKey = (e: React.KeyboardEvent) => {
    const steps: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -focused.getUTCDay()),
      End: () => addDays(focused, 6 - focused.getUTCDay()),
      PageUp: () => utc(focused.getUTCFullYear(), focused.getUTCMonth() - 1, Math.min(focused.getUTCDate(), daysIn(focused.getUTCFullYear(), focused.getUTCMonth() - 1))),
      PageDown: () => utc(focused.getUTCFullYear(), focused.getUTCMonth() + 1, Math.min(focused.getUTCDate(), daysIn(focused.getUTCFullYear(), focused.getUTCMonth() + 1))),
    };
    const step = steps[e.key];
    if (!step) return;
    e.preventDefault();
    const next = clamp(step());
    setFocused(next);
    showMonthOf(next);
  };

  const changeMonth = (y: number, m: number) => {
    const first = utc(y, m, 1);
    const target = clamp(utc(y, m, Math.min(focused.getUTCDate(), daysIn(y, m))));
    setView({ y: first.getUTCFullYear(), m: first.getUTCMonth() });
    setFocused(target.getUTCMonth() === first.getUTCMonth() ? target : clamp(first));
  };

  const atFirstMonth = view.y === today.getUTCFullYear() && view.m === today.getUTCMonth();
  const atLastMonth = view.y === maxYear && view.m === 11;
  const leading = utc(view.y, view.m, 1).getUTCDay();

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
        aria-describedby={note ? noteId : undefined}
        onClick={() => (open ? close(false) : openPicker())}
        className={`flex w-full items-center justify-between gap-3 rounded-[6px] border bg-white px-3.5 py-3 text-left text-base transition-shadow ${
          open ? "border-(--m-ink)/50 ring-3 ring-(--m-gold)/35" : "border-(--m-mist) hover:border-(--m-ink)/40"
        }`}
      >
        <span className={selected ? "" : "text-(--m-ink)/50"}>{selected ? shortDate(selected) : placeholder}</span>
        <CalendarDays aria-hidden size={19} className="shrink-0 text-(--m-ink)/60" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose your wedding date"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            }
          }}
          className="absolute top-[calc(100%+8px)] left-0 z-30 grid w-[min(100%,21rem)] gap-3 rounded-[8px] border border-(--m-mist) bg-white p-3.5 shadow-[0_24px_48px_-28px_rgb(22_32_74/0.55)]"
        >
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous month"
              disabled={atFirstMonth}
              onClick={() => changeMonth(view.y, view.m - 1)}
              className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-(--m-paper) disabled:opacity-30"
            >
              <ChevronLeft aria-hidden size={18} />
            </button>
            <select
              aria-label="Month"
              value={view.m}
              onChange={(e) => changeMonth(view.y, Number(e.target.value))}
              className="min-w-0 flex-1 border border-(--m-mist) bg-white px-2 py-1.5 text-sm font-semibold"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i} disabled={view.y === today.getUTCFullYear() && i < today.getUTCMonth()}>
                  {m}
                </option>
              ))}
            </select>
            <select
              aria-label="Year"
              value={view.y}
              onChange={(e) => changeMonth(Number(e.target.value), view.m)}
              className="border border-(--m-mist) bg-white px-2 py-1.5 text-sm font-semibold"
            >
              {Array.from({ length: yearsAhead + 1 }, (_, i) => today.getUTCFullYear() + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label="Next month"
              disabled={atLastMonth}
              onClick={() => changeMonth(view.y, view.m + 1)}
              className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-(--m-paper) disabled:opacity-30"
            >
              <ChevronRight aria-hidden size={18} />
            </button>
          </div>

          <div ref={gridRef} role="group" aria-label={`${MONTHS[view.m]} ${view.y}`} onKeyDown={onGridKey} className="grid grid-cols-7 gap-1 text-center">
            {DAYS.map((d, i) => (
              <span key={d} aria-hidden className={`pb-1 text-xs font-semibold ${i === 0 || i === 6 ? "text-(--m-emerald)" : "text-(--m-ink)/55"}`}>
                {d.slice(0, 2)}
              </span>
            ))}
            {Array.from({ length: leading }, (_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysIn(view.y, view.m) }, (_, i) => {
              const date = utc(view.y, view.m, i + 1);
              const key = iso(date);
              const holiday = holidayOn(key);
              const isSelected = selected !== null && key === iso(selected);
              const isFocused = key === iso(focused);
              const disabled = date < today;
              return (
                <button
                  key={key}
                  type="button"
                  tabIndex={isFocused ? 0 : -1}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  aria-label={`${longDate(date)}${holiday ? `, ${holiday}` : ""}${key === iso(today) ? ", today" : ""}`}
                  title={holiday ?? undefined}
                  onClick={() => pick(date)}
                  onFocus={() => {
                    if (!isFocused) setFocused(date);
                  }}
                  className={`relative aspect-square rounded-full text-sm font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--m-ink) disabled:cursor-not-allowed disabled:text-(--m-ink)/25 motion-reduce:transition-none ${
                    isSelected
                      ? "bg-(--m-gold) font-bold text-(--m-ink)"
                      : disabled
                        ? ""
                        : `${isWeekend(date) ? "bg-(--m-emerald)/8" : ""} hover:bg-(--m-paper)`
                  } ${key === iso(today) && !isSelected ? "ring-1 ring-(--m-mist) ring-inset" : ""}`}
                >
                  {i + 1}
                  {holiday && <span aria-hidden className="absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-(--m-coral)" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-(--m-mist) pt-3">
            <span className="flex items-center gap-1.5 text-xs text-(--m-ink)/60">
              <span aria-hidden className="size-1.5 rounded-full bg-(--m-coral)" /> Public holiday
            </span>
            <span className="flex gap-2">
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    close();
                  }}
                  className="rounded-full border border-(--m-ink)/25 px-3.5 py-1.5 text-sm font-medium hover:border-(--m-ink)"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => close()}
                className="rounded-full bg-(--m-ink) px-3.5 py-1.5 text-sm font-medium text-(--m-paper) hover:bg-(--m-emerald)"
              >
                Done
              </button>
            </span>
          </div>
        </div>
      )}

      {note && (
        <p id={noteId} aria-live="polite" className="mt-2 flex flex-wrap gap-x-3 text-sm">
          <span className="font-semibold text-(--m-emerald)">{note.countdown}</span>
          {note.holiday && <span className="text-(--m-coral-deep)">{note.holiday}</span>}
        </p>
      )}
    </div>
  );
}
