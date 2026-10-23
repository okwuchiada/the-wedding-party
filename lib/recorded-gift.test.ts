import { describe, expect, it } from "vitest";
import { MAX_GIFT_NOTE_LENGTH, parseRecordedGift } from "@/lib/recorded-gift";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const valid = { registryItemId: "item_1", guestName: "  Aunty Bisi ", amount: "25000.50", note: " Cash at the reception " };

describe("parseRecordedGift", () => {
  it("trims fields and converts the amount to kobo", () => {
    expect(parseRecordedGift(form(valid))).toEqual({
      registryItemId: "item_1",
      guestName: "Aunty Bisi",
      amountCents: 2500050,
      note: "Cash at the reception",
    });
  });

  it("treats an empty note as none", () => {
    expect(parseRecordedGift(form({ ...valid, note: "  " }))).toMatchObject({ note: null });
  });

  it("needs a gift, a name and a positive amount", () => {
    expect(parseRecordedGift(form({ ...valid, registryItemId: "" }))).toEqual({ error: "Choose which gift it's for" });
    expect(parseRecordedGift(form({ ...valid, guestName: " " }))).toEqual({ error: "Add who it's from" });
    for (const amount of ["", "0", "-5", "abc", "0.001"]) {
      expect(parseRecordedGift(form({ ...valid, amount }))).toEqual({ error: "Enter the amount you received" });
    }
  });

  it("limits the note length", () => {
    expect(parseRecordedGift(form({ ...valid, note: "x".repeat(MAX_GIFT_NOTE_LENGTH + 1) }))).toHaveProperty("error");
  });
});
