"use client";

import type { RsvpView } from "@/lib/types";

export default function RsvpTab({ rsvps }: { rsvps: RsvpView[] }) {
  const attendingGuests = rsvps
    .filter((r) => r.attending)
    .reduce((sum, r) => sum + r.guestCount, 0);
  const declinedCount = rsvps.filter((r) => !r.attending).length;

  return (
    <div>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="bg-white p-4 shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)]">
          <p className="text-[10.5px] tracking-[.16em] text-foreground/55 uppercase">Attending</p>
          <p className="mt-2 font-(family-name:--serif) text-2xl text-foreground">
            {attendingGuests} <span className="text-base text-foreground/40">/ 100</span>
          </p>
        </div>
        <div className="bg-white p-4 shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)]">
          <p className="text-[10.5px] tracking-[.16em] text-foreground/55 uppercase">Declined</p>
          <p className="mt-2 font-(family-name:--serif) text-2xl text-foreground">{declinedCount}</p>
        </div>
      </div>

      <h2 className="mb-5 font-(family-name:--serif) text-2xl text-foreground">RSVPs</h2>

      {rsvps.length === 0 ? (
        <p className="text-sm text-foreground/60">No responses yet.</p>
      ) : (
        <div className="overflow-x-auto border border-olive/15">
          <table className="w-full min-w-150 text-left text-sm">
            <thead>
              <tr className="border-b border-olive/15 text-[11px] tracking-widest text-foreground/50 uppercase">
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Attending</th>
                <th className="px-4 py-3 font-medium">Guests</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((r) => (
                <tr key={r.id} className="border-b border-olive/10 last:border-0">
                  <td className="px-4 py-3 text-foreground">{r.guestName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium ${r.attending ? "text-olive" : "text-burnt-orange"}`}
                    >
                      {r.attending ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{r.attending ? r.guestCount : "—"}</td>
                  <td className="px-4 py-3 text-foreground/70">{r.message || "—"}</td>
                  <td className="px-4 py-3 text-foreground/70">{r.dateSubmitted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
