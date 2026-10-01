import { cn } from "@/lib/utils";

/** The one-line outcome under a staff action: an error in coral, a confirmation in emerald. */
export function ResultText({ error, message, className }: { error?: string; message?: string; className?: string }) {
  if (error) return <span role="alert" className={cn("text-xs text-coral-deep", className)}>{error}</span>;
  if (message) return <span role="status" className={cn("text-xs text-emerald", className)}>{message}</span>;
  return null;
}
