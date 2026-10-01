"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const cls = "text-muted-foreground hover:bg-accent hover:text-ink disabled:opacity-30";
  return (
    <span className="flex">
      <Button type="button" variant="ghost" size="icon" aria-label={`Move ${name} earlier`} disabled={disabled || first} onClick={() => onMove("up")} className={cls}>
        <ChevronUp aria-hidden size={18} />
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label={`Move ${name} later`} disabled={disabled || last} onClick={() => onMove("down")} className={cls}>
        <ChevronDown aria-hidden size={18} />
      </Button>
    </span>
  );
}
