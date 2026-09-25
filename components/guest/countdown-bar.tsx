"use client";

import { useEffect, useState } from "react";

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function getRemaining(target: string): Remaining {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownBar({ target }: { target: string }) {
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(getRemaining(target));
    const timeout = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(id);
    };
  }, [target]);

  const units = [
    { label: "Days", value: remaining?.days },
    { label: "Hours", value: remaining?.hours },
    { label: "Min", value: remaining?.minutes },
    { label: "Sec", value: remaining?.seconds },
  ];

  return (
    <div className="flex border border-foreground/20 bg-ivory/10 text-sm text-foreground/80 backdrop-blur-sm">
      {units.map((unit, i) => (
        <div
          key={unit.label}
          className={`min-w-0 flex-1 bg-ivory/10 px-1 pt-4 pb-3 text-center sm:px-2.5 sm:pt-4.5 sm:pb-3.5 ${
            i === 0 ? "" : "border-l border-foreground/20"
          }`}
        >
          <div className="font-(family-name:--serif) text-[32px] leading-none font-medium text-foreground tabular-nums sm:text-[42px]">
            {unit.value === undefined ? "--" : String(unit.value).padStart(2, "0")}
          </div>
          <div className="mt-2 font-(family-name:--sans) text-[12px] tracking-[.12em] text-burnt-orange uppercase sm:tracking-[.26em]">
            {unit.label}
          </div>
        </div>
      ))}
    </div>
  );
}
