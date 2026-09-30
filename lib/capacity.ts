/** Most guests who can attend: the couple's own limit, capped by their plan's. */
export function guestCapacity(weddingMax: number, planMax: number | null | undefined) {
  return Math.min(weddingMax, planMax ?? weddingMax);
}

export function seatsLeft(capacity: number, taken: number) {
  return Math.max(0, capacity - taken);
}

/** Why a party can't be seated, or null if it fits. */
export function capacityError(partySize: number, left: number) {
  if (left <= 0) return "Sorry, we've reached full capacity and can no longer accept RSVPs.";
  if (partySize > left) return `Only ${left} ${left === 1 ? "place is" : "places are"} left. Please reduce your party size.`;
  return null;
}

/**
 * Why the couple can't save an RSVP with this many seats, or null. Only more
 * seats than before are checked, and the RSVP's own current seats count as free.
 */
export function seatChangeError(input: { attending: boolean | undefined; partySize: number; seatsBefore: number; taken: number; capacity: number }) {
  if (!input.attending || input.partySize <= input.seatsBefore) return null;
  return capacityError(input.partySize, seatsLeft(input.capacity, input.taken - input.seatsBefore));
}
