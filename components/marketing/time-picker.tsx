"use client";

import { Clock } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PICKER_FIELD_CLASS, PICKER_PANEL_CLASS } from "./picker-styles";

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
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const [h, m] = (value || "16:00").split(":");
  const hour24 = Number(h);
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const pm = hour24 >= 12;
  // Keep an unusual saved minute (e.g. :10) selectable.
  const minutes = MINUTES.includes(m) ? MINUTES : [...MINUTES, m].sort();

  // Radix closes the popover on Escape or an outside click and returns focus to the field.
  const close = () => setOpen(false);

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" id={id} aria-labelledby={labelledBy ? `${labelledBy} ${id}` : undefined} className={PICKER_FIELD_CLASS}>
            <span className={value ? "" : "text-ink/50"}>{value ? formatTime(value) : placeholder}</span>
            <Clock aria-hidden className="size-[19px] shrink-0 text-ink/60" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          ref={panelRef}
          align="start"
          aria-label="Choose the wedding time"
          // Start on the selected quick time, or the first one.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (panelRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]') ??
              panelRef.current?.querySelector<HTMLButtonElement>("button"))?.focus();
          }}
          className={`${PICKER_PANEL_CLASS} w-[min(var(--radix-popover-trigger-width),20rem)] min-w-[17rem]`}
        >
          <p className="text-xs font-semibold text-ink/60">Common times</p>
          <div className="grid grid-cols-3 gap-1.5">
            {QUICK_TIMES.map((t) => {
              const selected = t === value;
              return (
                <Button
                  key={t}
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(t);
                    close();
                  }}
                  className={cn(
                    "px-2 text-sm tabular-nums",
                    selected ? "bg-gold font-bold text-ink hover:bg-gold" : "bg-paper hover:bg-mist"
                  )}
                >
                  {formatTime(t)}
                </Button>
              );
            })}
          </div>

          <p className="border-t border-mist pt-3 text-xs font-semibold text-ink/60">Exact time</p>
          <div className="flex items-center gap-1.5">
            <Select value={String(hour12)} onValueChange={(v) => onChange(to24(Number(v), m, pm))}>
              <SelectTrigger size="sm" aria-label="Hour" className="min-w-0 flex-1 font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((hr) => (
                  <SelectItem key={hr} value={String(hr)}>
                    {hr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span aria-hidden className="font-semibold">
              :
            </span>
            <Select value={m} onValueChange={(v) => onChange(to24(hour12, v, pm))}>
              <SelectTrigger size="sm" aria-label="Minute" className="min-w-0 flex-1 font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {minutes.map((min) => (
                  <SelectItem key={min} value={min}>
                    {min}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div role="group" aria-label="AM or PM" className="flex overflow-hidden rounded-full border border-mist">
              {(["AM", "PM"] as const).map((half) => {
                const active = (half === "PM") === pm;
                return (
                  <Button
                    key={half}
                    type="button"
                    variant="ghost"
                    size="xs"
                    aria-pressed={active}
                    onClick={() => onChange(to24(hour12, m, half === "PM"))}
                    className={cn("rounded-none px-2.5 font-semibold", active ? "bg-ink text-paper hover:bg-ink" : "hover:bg-paper")}
                  >
                    {half}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end border-t border-mist pt-3">
            <Button
              type="button"
              variant="ink"
              size="xs"
              onClick={() => {
                if (!value) onChange(to24(hour12, m, pm));
                close();
              }}
              className="px-3.5 text-sm font-medium"
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
