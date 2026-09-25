"use server";

import { headers } from "next/headers";
import type { ScopedPrisma } from "@/lib/db-scoped";
import { requireWeddingAccess } from "@/lib/dal";
import { getWeddingById, resolveGuestAction, revalidateDashboard, weddingTheme } from "@/lib/tenant";
import { emailPalette, sendMail, rsvpConfirmationEmail } from "@/lib/mail";
import { coupleNames, resolveLayout } from "@/lib/layouts";
import { getClientIp } from "@/lib/request";
import { capacityError, guestCapacity, seatChangeError, seatsLeft } from "@/lib/capacity";
import { parseAdminRsvp, parseGuestRsvp } from "@/lib/rsvp-rules";

export type SubmitRsvpState =
  | { error?: string; success?: boolean; guestName?: string; attending?: boolean }
  | undefined;

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const BURST_WINDOW_MS = 30 * 1000;

function findRsvpByEmail(db: ScopedPrisma, email: string, excludeId?: string) {
  return db.rsvp.findFirst({
    where: {
      email: { equals: email.trim(), mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, guestName: true },
  });
}

export async function submitRsvp(
  slug: string,
  _prevState: SubmitRsvpState,
  formData: FormData
): Promise<SubmitRsvpState> {
  const guest = await resolveGuestAction(slug);
  if (!guest) return { error: "This wedding isn't accepting RSVPs." };
  const { wedding, db } = guest;

  const honeypot = formData.get("hp_rsvp_x7");
  const name = formData.get("name");
  const attendingRaw = formData.get("attending");

  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    console.warn("RSVP honeypot triggered; submission discarded", {
      name,
      honeypot: honeypot.slice(0, 50),
    });
    const trimmedFirst = typeof name === "string" && name.trim() ? name.trim().split(/\s+/)[0] : "Guest";
    return {
      success: true,
      guestName: trimmedFirst,
      attending: attendingRaw === "yes",
    };
  }

  const ip = await getClientIp();
  const userAgent = (await headers()).get("user-agent");

  if (ip) {
    const recent = await db.rsvp.findMany({
      where: { weddingId: wedding.id, ipAddress: ip, createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) } },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    if (recent.length >= RATE_LIMIT_MAX) {
      return { error: "Too many RSVP attempts from your network. Please try again later." };
    }
    if (recent[0] && Date.now() - recent[0].createdAt.getTime() < BURST_WINDOW_MS) {
      return { error: "Please wait a moment before submitting again." };
    }
  }

  const parsed = parseGuestRsvp({
    name: formData.get("name"),
    email: formData.get("email"),
    attending: attendingRaw,
    partySize: formData.get("partySize"),
    message: formData.get("message"),
  });
  if ("error" in parsed) return { error: parsed.error };
  const { guestName, email, attending, guestCount, message } = parsed.data;

  // Without an email, the guest's name is what tells two replies apart.
  const duplicate = email
    ? await findRsvpByEmail(db, email)
    : await db.rsvp.findFirst({
        where: { weddingId: wedding.id, guestName: { equals: guestName, mode: "insensitive" } },
        select: { id: true },
      });
  if (duplicate) {
    return { error: "We already have an RSVP under this name or email. Please contact the couple to change it." };
  }

  if (attending) {
    const { _sum } = await db.rsvp.aggregate({
      where: { weddingId: wedding.id, attending: true },
      _sum: { guestCount: true },
    });
    const left = seatsLeft(guestCapacity(wedding.maxGuests, wedding.plan?.maxGuests), _sum.guestCount ?? 0);
    const full = capacityError(guestCount, left);
    if (full) return { error: full };
  }

  await db.rsvp.create({
    data: { weddingId: wedding.id, guestName, email, attending, guestCount, message, ipAddress: ip, userAgent },
  });

  revalidateDashboard(wedding);

  return { success: true, guestName: guestName.split(" ")[0], attending };
}

export async function deleteRsvp(weddingId: string, id: string): Promise<{ error?: string }> {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "deleteRsvp");
  const { count } = await db.rsvp.deleteMany({ where: { id, weddingId: wedding.id } });
  if (count === 0) return { error: "RSVP not found" };
  revalidateDashboard(wedding);
  return {};
}

export type AdminRsvpFormState = { error?: string; success?: boolean } | undefined;

function parseAdminRsvpForm(formData: FormData) {
  const attendingRaw = formData.get("attending");
  return parseAdminRsvp({
    guestName: formData.get("guestName"),
    email: formData.get("email"),
    attending: attendingRaw === "yes" ? true : attendingRaw === "no" ? false : undefined,
    message: formData.get("message"),
  });
}

/** Whether the couple's attending total still fits with this RSVP at `partySize` seats (it held `seatsBefore`). */
async function seatsError(
  db: Awaited<ReturnType<typeof requireWeddingAccess>>["db"],
  wedding: Awaited<ReturnType<typeof requireWeddingAccess>>["wedding"],
  partySize: number,
  seatsBefore: number
) {
  const { _sum } = await db.rsvp.aggregate({ where: { weddingId: wedding.id, attending: true }, _sum: { guestCount: true } });
  return seatChangeError({
    attending: true,
    partySize,
    seatsBefore,
    taken: _sum.guestCount ?? 0,
    capacity: guestCapacity(wedding.maxGuests, wedding.plan?.maxGuests),
  });
}

export async function createRsvpAdmin(
  weddingId: string,
  _prevState: AdminRsvpFormState,
  formData: FormData
): Promise<AdminRsvpFormState> {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "createRsvpAdmin");

  const parsed = parseAdminRsvpForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { email, guestName } = parsed.data;
  const duplicate = email
    ? await findRsvpByEmail(db, email)
    : await db.rsvp.findFirst({
        where: { weddingId: wedding.id, guestName: { equals: guestName, mode: "insensitive" } },
        select: { id: true, guestName: true },
      });
  if (duplicate) {
    return {
      error: `${duplicate.guestName} has already RSVPed${email ? " with this email" : ""}. Use Edit on their row instead.`,
    };
  }

  if (parsed.data.attending) {
    const full = await seatsError(db, wedding, 1, 0);
    if (full) return { error: full };
  }

  await db.rsvp.create({ data: { ...parsed.data, weddingId: wedding.id } });

  revalidateDashboard(wedding);
  return { success: true };
}

export async function updateRsvpAdmin(
  weddingId: string,
  _prevState: AdminRsvpFormState,
  formData: FormData
): Promise<AdminRsvpFormState> {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "updateRsvpAdmin");

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing RSVP id" };

  const parsed = parseAdminRsvpForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const existing = await db.rsvp.findUnique({ where: { id, weddingId: wedding.id } });
  if (!existing) return { error: "RSVP not found" };

  if (parsed.data.email) {
    const duplicate = await findRsvpByEmail(db, parsed.data.email, id);
    if (duplicate) return { error: `${duplicate.guestName} already uses this email` };
  }

  // Switching a declined guest to attending needs their seats to fit; their own count as free.
  if (parsed.data.attending) {
    const full = await seatsError(db, wedding, existing.guestCount, existing.attending ? existing.guestCount : 0);
    if (full) return { error: full };
  }

  // A changed response or address makes any sent confirmation stale.
  const stale =
    existing.attending !== parsed.data.attending || existing.email !== parsed.data.email;

  await db.rsvp.update({
    where: { id, weddingId: wedding.id },
    data: { ...parsed.data, ...(stale ? { confirmationSentAt: null } : {}) },
  });

  revalidateDashboard(wedding);
  return { success: true };
}

export type ImportRsvpRow = {
  guestName: unknown;
  email: unknown;
  attending: unknown;
  message: unknown;
};

export type ImportRsvpsResult = {
  error?: string;
  created?: number;
  updated?: number;
  rowErrors?: { row: number; error: string }[];
};

const MAX_IMPORT_ROWS = 1000;

// Rows match existing RSVPs by email, or by name when the row has no email,
// so re-uploading an edited sheet updates guests instead of duplicating them.
export async function importRsvps(
  weddingId: string,
  rows: ImportRsvpRow[]
): Promise<ImportRsvpsResult> {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "importRsvps");

  if (!Array.isArray(rows) || rows.length === 0) return { error: "The file has no guest rows" };
  if (rows.length > MAX_IMPORT_ROWS) return { error: `Too many rows (max ${MAX_IMPORT_ROWS})` };

  const valid: Extract<ReturnType<typeof parseAdminRsvp>, { data: unknown }>["data"][] = [];
  const rowErrors: { row: number; error: string }[] = [];
  rows.forEach((raw, i) => {
    const parsed = parseAdminRsvp(raw);
    // +2 so numbers match the spreadsheet: 1-based, after the header row.
    if ("error" in parsed) rowErrors.push({ row: i + 2, error: parsed.error });
    else valid.push(parsed.data);
  });

  if (rowErrors.length > 0) {
    return { error: "Nothing was imported. Fix these rows and upload again.", rowErrors };
  }

  const existing = await db.rsvp.findMany({
    where: { weddingId: wedding.id },
    select: { id: true, guestName: true, email: true, attending: true },
  });
  const byEmail = new Map(existing.filter((r) => r.email).map((r) => [r.email.toLowerCase(), r]));
  const byName = new Map(existing.map((r) => [r.guestName.toLowerCase(), r]));

  let created = 0;
  let updated = 0;
  const seen = new Set<string>();

  await db.$transaction(
    async (tx) => {
      for (const data of valid) {
        const key = data.email ? `e:${data.email.toLowerCase()}` : `n:${data.guestName.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const match = data.email
          ? byEmail.get(data.email.toLowerCase())
          : byName.get(data.guestName.toLowerCase());

        if (match) {
          await tx.rsvp.update({
            where: { id: match.id, weddingId: wedding.id },
            data: {
              ...data,
              // A name-matched row without an email keeps the address on file.
              email: data.email || match.email,
              ...(match.attending !== data.attending ? { confirmationSentAt: null } : {}),
            },
          });
          updated++;
        } else {
          await tx.rsvp.create({ data: { ...data, weddingId: wedding.id } });
          created++;
        }
      }
    },
    { timeout: 60_000 }
  );

  revalidateDashboard(wedding);
  return { created, updated };
}

export async function sendRsvpConfirmation(
  weddingId: string,
  id: string
): Promise<{ error?: string }> {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "sendRsvpConfirmation");

  const rsvp = await db.rsvp.findUnique({ where: { id, weddingId: wedding.id } });
  if (!rsvp) return { error: "RSVP not found" };
  if (rsvp.confirmationSentAt) return { error: "Confirmation already sent" };
  if (!rsvp.email) return { error: "This guest has no email address" };

  const [story, settings] = await Promise.all([
    db.storyContent.findUnique({ where: { weddingId: wedding.id } }),
    getWeddingById(wedding.id),
  ]);
  if (!story) return { error: "Story details not configured" };

  const delivered = await sendMail({
    to: rsvp.email,
    ...rsvpConfirmationEmail({
      guestName: rsvp.guestName,
      attending: rsvp.attending,
      // As the couple chose to show their names (full or first names only).
      brideName: coupleNames(story, resolveLayout(settings.theme).heroNames)[0],
      groomName: coupleNames(story, resolveLayout(settings.theme).heroNames)[1],
      weddingDate: story.weddingDate,
      location: story.location,
      venueAddress: story.venueAddress,
      bridePhone: story.bridePhone,
      phoneCountryCode: settings.phoneCountryCode,
      asoebi: {
        enabled: settings.copy?.asoebiEnabled ?? false,
        fabric: settings.copy?.asoebiFabric ?? null,
      },
      palette: emailPalette(weddingTheme(settings).colors),
    }),
  });

  // Only mark it sent once the email really went, so "Not confirmed" stays honest.
  if (!delivered) return { error: "The email didn't send. Try again in a few minutes." };

  await db.rsvp.update({
    where: { id, weddingId: wedding.id },
    data: { confirmationSentAt: new Date() },
  });
  revalidateDashboard(wedding);
  return {};
}
