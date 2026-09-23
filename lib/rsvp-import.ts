import type { ImportRsvpRow } from "@/lib/actions/rsvp";

type Cell = string | number | boolean | Date | null | undefined;

export const RSVP_TEMPLATE_CSV =
  "Name,Email,Attending,Message\n" +
  "Jane Doe,jane@example.com,Yes,Can't wait!\n" +
  "John Smith,,No,\n";

const HEADER_ALIASES: Record<keyof ImportRsvpRow | "firstName" | "lastName", string[]> = {
  guestName: ["name", "guest", "guestname", "fullname", "guestfullname"],
  firstName: ["firstname", "first"],
  lastName: ["lastname", "last", "surname"],
  email: ["email", "emailaddress", "e-mail"],
  attending: ["attending", "attendance", "rsvp", "response", "status", "coming"],
  message: ["message", "note", "notes", "comment", "comments"],
};

const YES = new Set(["yes", "y", "true", "1", "attending", "accept", "accepted", "going"]);
const NO = new Set(["no", "n", "false", "0", "declined", "decline", "not attending", "notattending"]);

function normalizeHeader(h: Cell) {
  return String(h ?? "").toLowerCase().replace(/[\s_#.()]/g, "");
}

function cellText(c: Cell) {
  if (c instanceof Date) return c.toISOString().slice(0, 10);
  return String(c ?? "").trim();
}

function parseAttending(c: Cell): boolean | string {
  if (typeof c === "boolean") return c;
  const text = cellText(c).toLowerCase();
  if (YES.has(text)) return true;
  if (NO.has(text)) return false;
  return text;
}

// Minimal RFC 4180 parser: quoted fields, escaped quotes, CRLF, commas in quotes.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function sheetToRsvpRows(sheet: Cell[][]): { rows?: ImportRsvpRow[]; error?: string } {
  const [header, ...body] = sheet;
  if (!header) return { error: "The file is empty" };

  const normalized = header.map(normalizeHeader);
  const col = (key: keyof typeof HEADER_ALIASES) =>
    normalized.findIndex((h) => HEADER_ALIASES[key].includes(h));

  const idx = {
    guestName: col("guestName"),
    firstName: col("firstName"),
    lastName: col("lastName"),
    email: col("email"),
    attending: col("attending"),
    message: col("message"),
  };

  if (idx.guestName === -1 && idx.firstName === -1) {
    return { error: 'Missing a "Name" column (or "First name" / "Last name")' };
  }
  if (idx.attending === -1) return { error: 'Missing an "Attending" column' };

  const get = (r: Cell[], i: number) => (i === -1 ? undefined : r[i]);

  const rows = body
    .filter((r) => r.some((c) => cellText(c) !== ""))
    .map((r) => {
      const guestName =
        idx.guestName !== -1
          ? cellText(r[idx.guestName])
          : `${cellText(get(r, idx.firstName))} ${cellText(get(r, idx.lastName))}`.trim();
      return {
        guestName,
        email: cellText(get(r, idx.email)),
        attending: parseAttending(get(r, idx.attending)),
        message: cellText(get(r, idx.message)),
      };
    });

  if (rows.length === 0) return { error: "The file has no guest rows" };
  return { rows };
}

export async function readRsvpFile(file: File): Promise<{ rows?: ImportRsvpRow[]; error?: string }> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) {
    return sheetToRsvpRows(parseCsv(await file.text()));
  }
  if (name.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/browser");
    try {
      return sheetToRsvpRows((await readSheet(file)) as Cell[][]);
    } catch {
      return { error: "Couldn't read that Excel file" };
    }
  }
  if (name.endsWith(".xls")) {
    return { error: "Old .xls files aren't supported. Save it as .xlsx or .csv and try again." };
  }
  return { error: "Upload a .csv or .xlsx file" };
}
