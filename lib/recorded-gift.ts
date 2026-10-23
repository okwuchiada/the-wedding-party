/** Longest note a couple can keep on a gift they record, e.g. "Cash at the reception". */
export const MAX_GIFT_NOTE_LENGTH = 200;
export const MAX_GUEST_NAME_LENGTH = 100;

export type RecordedGift = { registryItemId: string; guestName: string; amountCents: number; note: string | null };

/**
 * Reads the Contributions → "Record a gift" form: a gift the couple received
 * outside the site. `amount` is in major units (naira), like registry prices.
 */
export function parseRecordedGift(formData: FormData): RecordedGift | { error: string } {
  const registryItemId = formData.get("registryItemId");
  if (typeof registryItemId !== "string" || !registryItemId) return { error: "Choose which gift it's for" };

  const guestName = String(formData.get("guestName") ?? "").trim();
  if (!guestName) return { error: "Add who it's from" };
  if (guestName.length > MAX_GUEST_NAME_LENGTH) return { error: `Keep the name under ${MAX_GUEST_NAME_LENGTH} characters` };

  const amount = Number(formData.get("amount"));
  const amountCents = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amountCents <= 0) return { error: "Enter the amount you received" };

  const note = String(formData.get("note") ?? "").trim();
  if (note.length > MAX_GIFT_NOTE_LENGTH) return { error: `Keep the note under ${MAX_GIFT_NOTE_LENGTH} characters` };

  return { registryItemId, guestName, amountCents, note: note || null };
}
