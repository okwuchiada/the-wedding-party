/** "SAT 12 DEC": day first, as guests in Nigeria read dates. */
export function formatNavDate(weddingDateISO: string) {
  return new Date(weddingDateISO)
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
    .replace(",", "")
    .toUpperCase();
}
