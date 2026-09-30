"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

/** "Move earlier" / "Move later" arrows for reordering a list. */
export default function MoveButtons({
  name,
  first,
  last,
  disabled,
  onMove,
}: {
  /** What's being moved, for screen readers ("Move Proposal earlier"). */
  name: string;
  first: boolean;
  last: boolean;
  disabled?: boolean;
  onMove: (direction: "up" | "down") => void;
}) {
  const cls =
    "grid size-9 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-ink";
  return (
    <span className="flex">
      <button type="button" aria-label={`Move ${name} earlier`} disabled={disabled || first} onClick={() => onMove("up")} className={cls}>
        <ChevronUp aria-hidden size={18} />
      </button>
      <button type="button" aria-label={`Move ${name} later`} disabled={disabled || last} onClick={() => onMove("down")} className={cls}>
        <ChevronDown aria-hidden size={18} />
      </button>
    </span>
  );
}
