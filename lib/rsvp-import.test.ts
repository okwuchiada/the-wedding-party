import { describe, expect, it } from "vitest";
import { parseCsv, sheetToRsvpRows } from "@/lib/rsvp-import";

describe("parseCsv", () => {
  it("handles quoted fields, escaped quotes and CRLF", () => {
    expect(parseCsv('Name,Message\r\n"Doe, Jane","She said ""hi"""\r\n')).toEqual([
      ["Name", "Message"],
      ["Doe, Jane", 'She said "hi"'],
    ]);
  });
});

describe("sheetToRsvpRows", () => {
  it("joins first and last name columns and parses attendance", () => {
    const { rows } = sheetToRsvpRows([
      ["First name", "Last name", "Attending"],
      ["Jane", "Doe", "yes"],
      ["", "", ""],
      ["John", "Smith", "No"],
    ]);
    expect(rows).toEqual([
      { guestName: "Jane Doe", email: "", attending: true, message: "" },
      { guestName: "John Smith", email: "", attending: false, message: "" },
    ]);
  });

  it("requires an Attending column", () => {
    expect(sheetToRsvpRows([["Name"], ["Jane"]]).error).toMatch(/Attending/);
  });
});
