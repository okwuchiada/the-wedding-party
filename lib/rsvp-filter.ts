type RsvpLike = { guestName: string; email: string; attending: boolean; confirmationSentAt: string | null };

export type RsvpFilter = "all" | "attending" | "declined" | "noEmail" | "notConfirmed";

export const RSVP_FILTERS: { id: RsvpFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "attending", label: "Attending" },
  { id: "declined", label: "Declined" },
  { id: "noEmail", label: "No email" },
  { id: "notConfirmed", label: "Not confirmed" },
];

const MATCHES: Record<RsvpFilter, (r: RsvpLike) => boolean> = {
  all: () => true,
  attending: (r) => r.attending,
  declined: (r) => !r.attending,
  noEmail: (r) => !r.email,
  notConfirmed: (r) => Boolean(r.email) && !r.confirmationSentAt,
};

/** RSVPs matching a search (name or email) and one filter chip. */
export function filterRsvps<T extends RsvpLike>(rsvps: T[], query: string, filter: RsvpFilter): T[] {
  const q = query.trim().toLowerCase();
  return rsvps.filter((r) => MATCHES[filter](r) && (!q || r.guestName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)));
}

export function rsvpFilterCounts(rsvps: RsvpLike[]): Record<RsvpFilter, number> {
  return Object.fromEntries(RSVP_FILTERS.map((f) => [f.id, rsvps.filter(MATCHES[f.id]).length])) as Record<RsvpFilter, number>;
}
