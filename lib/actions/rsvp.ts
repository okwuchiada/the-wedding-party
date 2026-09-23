"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { sendMail, rsvpConfirmationEmail } from "@/lib/mail";

export type SubmitRsvpState =
  | { error?: string; success?: boolean; guestName?: string; attending?: boolean }
  | undefined;

const MAX_TOTAL_GUESTS = 100;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const BURST_WINDOW_MS = 30 * 1000;

function findRsvpByEmail(email: string, excludeId?: string) {
  return prisma.rsvp.findFirst({
    where: {
      email: { equals: email.trim(), mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, guestName: true },
  });
}

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || null;
  return h.get("x-real-ip");
}

export async function submitRsvp(
  _prevState: SubmitRsvpState,
  formData: FormData
): Promise<SubmitRsvpState> {
  const honeypot = formData.get("hp_rsvp_x7");
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const attendingRaw = formData.get("attending");

  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    console.warn("RSVP honeypot triggered; submission discarded", {
      firstName,
      honeypot: honeypot.slice(0, 50),
    });
    const trimmedFirst =
      typeof firstName === "string" && firstName.trim() ? firstName.trim() : "Guest";
    return {
      success: true,
      guestName: trimmedFirst,
      attending: attendingRaw === "yes",
    };
  }

  const ip = await getClientIp();
  const userAgent = (await headers()).get("user-agent");

  if (ip) {
    const recent = await prisma.rsvp.findMany({
      where: { ipAddress: ip, createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) } },
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

  const email = formData.get("email");
  const message = formData.get("message");

  if (typeof firstName !== "string" || !firstName.trim()) {
    return { error: "Please enter your first name" };
  }
  if (typeof lastName !== "string" || !lastName.trim()) {
    return { error: "Please enter your last name" };
  }

  const guestName = `${firstName.trim()} ${lastName.trim()}`;
  if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return { error: "Please enter a valid email" };
  }
  if (attendingRaw !== "yes" && attendingRaw !== "no") {
    return { error: "Please let us know if you can make it" };
  }

  const attending = attendingRaw === "yes";

  if (await findRsvpByEmail(email)) {
    return {
      error:
        "You've already RSVPed with this email. Please contact the couple if you need to make changes.",
    };
  }

  if (attending) {
    const { _sum } = await prisma.rsvp.aggregate({
      where: { attending: true },
      _sum: { guestCount: true },
    });
    const currentTotal = _sum.guestCount ?? 0;
    if (currentTotal + 1 > MAX_TOTAL_GUESTS) {
      return { error: "Sorry, we've reached full capacity and can no longer accept RSVPs." };
    }
  }

  const trimmedEmail = email.trim();

  await prisma.rsvp.create({
    data: {
      guestName,
      email: trimmedEmail,
      attending,
      guestCount: 1,
      message: typeof message === "string" && message.trim() ? message.trim() : null,
      ipAddress: ip,
      userAgent,
    },
  });

  revalidatePath("/admin");

  return { success: true, guestName: firstName.trim(), attending };
}

export async function deleteRsvp(id: string): Promise<{ error?: string }> {
  await verifySession();
  await prisma.rsvp.delete({ where: { id } });
  revalidatePath("/admin");
  return {};
}

export type AdminRsvpFormState = { error?: string; success?: boolean } | undefined;

type AdminRsvpData = {
  guestName: string;
  email: string;
  attending: boolean;
  guestCount: number;
  message: string | null;
};

// Admin entries may come from phone calls or paper lists, so email is optional
// (stored as "" since the column is required).
function validateAdminRsvp(input: {
  guestName: unknown;
  email: unknown;
  attending: unknown;
  message: unknown;
}): { error: string } | { data: AdminRsvpData } {
  const guestName = typeof input.guestName === "string" ? input.guestName.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (!guestName) return { error: "Name is required" };
  if (email && !EMAIL_REGEX.test(email)) return { error: `Invalid email "${email}"` };
  if (typeof input.attending !== "boolean") return { error: "Attending must be yes or no" };

  // Each RSVP is one guest, matching the public form.
  return { data: { guestName, email, attending: input.attending, guestCount: 1, message: message || null } };
}

function parseAdminRsvpForm(formData: FormData) {
  const attendingRaw = formData.get("attending");
  return validateAdminRsvp({
    guestName: formData.get("guestName"),
    email: formData.get("email"),
    attending: attendingRaw === "yes" ? true : attendingRaw === "no" ? false : undefined,
    message: formData.get("message"),
  });
}

export async function createRsvpAdmin(
  _prevState: AdminRsvpFormState,
  formData: FormData
): Promise<AdminRsvpFormState> {
  await verifySession();

  const parsed = parseAdminRsvpForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { email, guestName } = parsed.data;
  const duplicate = email
    ? await findRsvpByEmail(email)
    : await prisma.rsvp.findFirst({
        where: { guestName: { equals: guestName, mode: "insensitive" } },
        select: { id: true, guestName: true },
      });
  if (duplicate) {
    return {
      error: `${duplicate.guestName} has already RSVPed${email ? " with this email" : ""}. Use Edit on their row instead.`,
    };
  }

  await prisma.rsvp.create({ data: parsed.data });

  revalidatePath("/admin");
  return { success: true };
}

export async function updateRsvpAdmin(
  _prevState: AdminRsvpFormState,
  formData: FormData
): Promise<AdminRsvpFormState> {
  await verifySession();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing RSVP id" };

  const parsed = parseAdminRsvpForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const existing = await prisma.rsvp.findUnique({ where: { id } });
  if (!existing) return { error: "RSVP not found" };

  if (parsed.data.email) {
    const duplicate = await findRsvpByEmail(parsed.data.email, id);
    if (duplicate) return { error: `${duplicate.guestName} already uses this email` };
  }

  // A changed response or address makes any sent confirmation stale.
  const stale =
    existing.attending !== parsed.data.attending || existing.email !== parsed.data.email;

  await prisma.rsvp.update({
    where: { id },
    data: { ...parsed.data, ...(stale ? { confirmationSentAt: null } : {}) },
  });

  revalidatePath("/admin");
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
export async function importRsvps(rows: ImportRsvpRow[]): Promise<ImportRsvpsResult> {
  await verifySession();

  if (!Array.isArray(rows) || rows.length === 0) return { error: "The file has no guest rows" };
  if (rows.length > MAX_IMPORT_ROWS) return { error: `Too many rows (max ${MAX_IMPORT_ROWS})` };

  const valid: AdminRsvpData[] = [];
  const rowErrors: { row: number; error: string }[] = [];
  rows.forEach((raw, i) => {
    const parsed = validateAdminRsvp(raw);
    // +2 so numbers match the spreadsheet: 1-based, after the header row.
    if ("error" in parsed) rowErrors.push({ row: i + 2, error: parsed.error });
    else valid.push(parsed.data);
  });

  if (rowErrors.length > 0) {
    return { error: "Nothing was imported. Fix these rows and upload again.", rowErrors };
  }

  const existing = await prisma.rsvp.findMany({
    select: { id: true, guestName: true, email: true, attending: true },
  });
  const byEmail = new Map(existing.filter((r) => r.email).map((r) => [r.email.toLowerCase(), r]));
  const byName = new Map(existing.map((r) => [r.guestName.toLowerCase(), r]));

  let created = 0;
  let updated = 0;
  const seen = new Set<string>();

  await prisma.$transaction(
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
            where: { id: match.id },
            data: {
              ...data,
              // A name-matched row without an email keeps the address on file.
              email: data.email || match.email,
              ...(match.attending !== data.attending ? { confirmationSentAt: null } : {}),
            },
          });
          updated++;
        } else {
          await tx.rsvp.create({ data });
          created++;
        }
      }
    },
    { timeout: 60_000 }
  );

  revalidatePath("/admin");
  return { created, updated };
}

export async function sendRsvpConfirmation(id: string): Promise<{ error?: string }> {
  await verifySession();

  const rsvp = await prisma.rsvp.findUnique({ where: { id } });
  if (!rsvp) return { error: "RSVP not found" };
  if (rsvp.confirmationSentAt) return { error: "Confirmation already sent" };
  if (!rsvp.email) return { error: "This guest has no email address" };

  const story = await prisma.storyContent.findUnique({ where: { id: "main" } });
  if (!story) return { error: "Story details not configured" };

  await sendMail({
    to: rsvp.email,
    ...rsvpConfirmationEmail({
      guestName: rsvp.guestName,
      attending: rsvp.attending,
      brideName: story.brideName,
      groomName: story.groomName,
      weddingDate: story.weddingDate,
      location: story.location,
      venueAddress: story.venueAddress,
      bridePhone: story.bridePhone,
    }),
  });

  await prisma.rsvp.update({ where: { id }, data: { confirmationSentAt: new Date() } });
  revalidatePath("/admin");
  return {};
}
