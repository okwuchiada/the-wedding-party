/** "12 Jun 2026" from an ISO date or timestamp, read as UTC so it never shifts a day. */
export function shortDate(iso: string) {
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
