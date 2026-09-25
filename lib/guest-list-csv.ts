type GuestRow = { guestName: string; email: string; attending: boolean; guestCount: number; message: string | null; dateSubmitted: string };

function csvCell(value: string) {
  // Guest-entered text could start with a formula character; prefix it so
  // Excel/Sheets treat it as text instead of executing it.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** The door list: attending guests, alphabetical, with party size and a blank column to tick. */
export function guestListCsv(rsvps: GuestRow[]) {
  const guests = rsvps.filter((r) => r.attending).sort((a, b) => a.guestName.localeCompare(b.guestName));
  return [
    ["#", "Name", "Party", "Email", "Message", "RSVP date", "Checked in"],
    ...guests.map((r, i) => [String(i + 1), r.guestName, String(r.guestCount), r.email, r.message ?? "", r.dateSubmitted, ""]),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}
