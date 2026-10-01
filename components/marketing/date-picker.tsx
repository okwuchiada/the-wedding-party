"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { holidayOn } from "@/lib/ng-holidays";
import { PICKER_FIELD_CLASS, PICKER_PANEL_CLASS } from "./picker-styles";

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
  const gridRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const noteId = `${id}-note`;
  const maxYear = today.getUTCFullYear() + yearsAhead;
  const maxDate = utc(maxYear, 11, 31);
  const selected = value ? parse(value) : null;
  const note = dateNote(value, today);

  const clamp = (d: Date) => (d < today ? today : d > maxDate ? maxDate : d);
  const showMonthOf = (d: Date) => setView({ y: d.getUTCFullYear(), m: d.getUTCMonth() });

  // Radix closes the popover on Escape or an outside click and returns focus to the field.
  const onOpenChange = (next: boolean) => {
    if (next) {
      const start = clamp(selected ?? today);
      setFocused(start);
      showMonthOf(start);
    }
    setOpen(next);
  };
  const close = () => setOpen(false);
  const pick = (d: Date) => {
    onChange(iso(d));
    close();
  };

  const focusActiveDay = () => gridRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();

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
    requestAnimationFrame(focusActiveDay);
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
    <div>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            aria-labelledby={labelledBy ? `${labelledBy} ${id}` : undefined}
            aria-describedby={note ? noteId : undefined}
            className={PICKER_FIELD_CLASS}
          >
            <span className={selected ? "" : "text-ink/50"}>{selected ? shortDate(selected) : placeholder}</span>
            <CalendarDays aria-hidden className="size-[19px] shrink-0 text-ink/60" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          aria-label="Choose your wedding date"
          // Start on the active day rather than the first button.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            focusActiveDay();
          }}
          className={`${PICKER_PANEL_CLASS} w-[min(var(--radix-popover-trigger-width),21rem)]`}
        >
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Previous month"
              disabled={atFirstMonth}
              onClick={() => changeMonth(view.y, view.m - 1)}
              className="hover:bg-paper disabled:opacity-30"
            >
              <ChevronLeft aria-hidden className="size-[18px]" />
            </Button>
            <Select value={String(view.m)} onValueChange={(v) => changeMonth(view.y, Number(v))}>
              <SelectTrigger size="sm" aria-label="Month" className="min-w-0 flex-1 font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={m} value={String(i)} disabled={view.y === today.getUTCFullYear() && i < today.getUTCMonth()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(view.y)} onValueChange={(v) => changeMonth(Number(v), view.m)}>
              <SelectTrigger size="sm" aria-label="Year" className="font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: yearsAhead + 1 }, (_, i) => today.getUTCFullYear() + i).map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Next month"
              disabled={atLastMonth}
              onClick={() => changeMonth(view.y, view.m + 1)}
              className="hover:bg-paper disabled:opacity-30"
            >
              <ChevronRight aria-hidden className="size-[18px]" />
            </Button>
          </div>

          <div ref={gridRef} role="group" aria-label={`${MONTHS[view.m]} ${view.y}`} onKeyDown={onGridKey} className="grid grid-cols-7 gap-1 text-center">
            {DAYS.map((d, i) => (
              <span key={d} aria-hidden className={`pb-1 text-xs font-semibold ${i === 0 || i === 6 ? "text-emerald" : "text-ink/55"}`}>
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
                  className={`relative aspect-square rounded-full text-sm font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink disabled:cursor-not-allowed disabled:text-ink/25 motion-reduce:transition-none ${
                    isSelected
                      ? "bg-gold font-bold text-ink"
                      : disabled
                        ? ""
                        : `${isWeekend(date) ? "bg-emerald/8" : ""} hover:bg-paper`
                  } ${key === iso(today) && !isSelected ? "ring-1 ring-mist ring-inset" : ""}`}
                >
                  {i + 1}
                  {holiday && <span aria-hidden className="absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-coral" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-mist pt-3">
            <span className="flex items-center gap-1.5 text-xs text-ink/60">
              <span aria-hidden className="size-1.5 rounded-full bg-coral" /> Public holiday
            </span>
            <span className="flex gap-2">
              {value && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    onChange("");
                    close();
                  }}
                  className="px-3.5 text-sm"
                >
                  Clear
                </Button>
              )}
              <Button type="button" variant="ink" size="xs" onClick={close} className="px-3.5 text-sm font-medium">
                Done
              </Button>
            </span>
          </div>
        </PopoverContent>
      </Popover>

      {note && (
        <p id={noteId} aria-live="polite" className="mt-2 flex flex-wrap gap-x-3 text-sm">
          <span className="font-semibold text-emerald">{note.countdown}</span>
          {note.holiday && <span className="text-coral-deep">{note.holiday}</span>}
        </p>
      )}
    </div>
  );
}
