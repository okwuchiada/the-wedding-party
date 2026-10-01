const DAY = 24 * 60 * 60 * 1000;

/** Calendar days between two dates in UTC, ignoring the time of day. */
function dayNumber(d: Date) {
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / DAY);
}

/** "74 days to go", "Tomorrow", "Today" or "Married 12 Sept 2026" for a wedding card. */
export function countdownLabel(weddingDate: Date, now = new Date()) {
  const days = dayNumber(weddingDate) - dayNumber(now);
  if (days > 1) return `${days} days to go`;
  if (days === 1) return "Tomorrow";
  if (days === 0) return "Today";
  return `Married ${weddingDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`;
}
