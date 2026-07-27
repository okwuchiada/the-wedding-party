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
    <div className="flex gap-6 border border-foreground/20 bg-ivory/10 text-sm text-foreground/80 backdrop-blur-sm">
      {units.map((unit, i) => (
        <div
          key={unit.label}
          className={`flex-1 bg-ivory/10 pt-4.5 px-2.5 pb-3.5 text-center ${
            i === 0 ? "" : "border-l border-foreground/20"
          }`}
        >
          <div className="font-(family-name:--serif) text-[42px] leading-none text-foreground font-medium tabular-nums">
            {unit.value === undefined ? "--" : String(unit.value).padStart(2, "0")}
          </div>
          <div className="mt-2 font-(family-name:--sans) text-[10px] uppercase tracking-[.26em] text-burnt-orange">
            {unit.label}
          </div>
        </div>
      ))}
    </div>
  );
}
