import type { StaffProfileView } from "@/lib/staff-profiles";

/** "Last updated 3 Oct 2026 by Ada" under a staff profile's heading. */
export function LastUpdated({ lastUpdated, self = false }: { lastUpdated: StaffProfileView["lastUpdated"]; self?: boolean }) {
  if (!lastUpdated) return <p className="mt-1 text-xs text-foreground/50">No details saved yet.</p>;
  const when = new Date(lastUpdated.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const who = lastUpdated.bySelf ? (self ? "you" : "them") : lastUpdated.by ?? "a former admin";
  return (
    <p className="mt-1 text-xs text-foreground/50">
      Last updated {when} by {who}.
    </p>
  );
}
