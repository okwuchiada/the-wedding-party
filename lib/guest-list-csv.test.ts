import { describe, expect, it } from "vitest";
import { guestListCsv } from "@/lib/guest-list-csv";

const rsvp = (guestName: string, attending: boolean, guestCount = 1, email = "", message: string | null = null) => ({
  guestName,
  email,
  attending,
  guestCount,
  message,
  dateSubmitted: "2026-09-12",
});

describe("guestListCsv", () => {
  it("lists attending guests alphabetically with their party size", () => {
    const csv = guestListCsv([rsvp("Tunde Bello", true, 1), rsvp("Femi Ade", false), rsvp("Ngozi Adeyemi", true, 4)]);
    expect(csv.split("\r\n")).toEqual([
      "#,Name,Party,Email,Message,RSVP date,Checked in",
      "1,Ngozi Adeyemi,4,,,2026-09-12,",
      "2,Tunde Bello,1,,,2026-09-12,",
    ]);
  });
  it("defuses spreadsheet formulas and quotes commas", () => {
    const csv = guestListCsv([rsvp("=HYPERLINK(1)", true, 1, "", "Hi, see you")]);
    expect(csv.split("\r\n")[1]).toBe(`1,'=HYPERLINK(1),1,,"Hi, see you",2026-09-12,`);
  });
});
