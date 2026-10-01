"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { getCurrentUser, requirePermission } from "@/lib/dal";
import { can, isStaff, ROLE_LABELS, STAFF_ROLES, type Role } from "@/lib/permissions";
import { decrypt, getSessionCookie, createSession } from "@/lib/session";
import { passwordResetEmail, sendMail, staffAccessEmail, staffWelcomeEmail } from "@/lib/mail";
import { fulfillPayment, resolvePaymentManually } from "@/lib/payments";
import { verifyTransaction } from "@/lib/paystack";
import { FEATURE_LABELS, type PlanFeature } from "@/lib/plans";
import { takeRateLimit } from "@/lib/rate-limit";
import { THEME_PRESETS } from "@/lib/themes";
import { prisma } from "@/lib/prisma";
import { issueTempPassword } from "@/lib/staff-accounts";
import { getStarterPlan } from "@/lib/starter-plan";
import { revalidateWedding } from "@/lib/tenant";
import { createUserToken } from "@/lib/tokens";

export type SuperActionResult = { error?: string; message?: string };

async function findWedding(weddingId: string) {
  return typeof weddingId === "string" ? prisma.wedding.findUnique({ where: { id: weddingId } }) : null;
}

// ─── Weddings ────────────────────────────────────────────────────────────────

const STATUS_ACTIONS = ["suspend", "restore", "archive"] as const;

/** Suspend or archive hides the guest site; restore returns it to live (if paid) or draft. */
export async function setWeddingStatus(
  weddingId: string,
  action: (typeof STATUS_ACTIONS)[number]
): Promise<SuperActionResult> {
  const admin = await requirePermission("wedding.status");
  if (!STATUS_ACTIONS.includes(action)) return { error: "Unknown action" };
  const wedding = await findWedding(weddingId);
  if (!wedding) return { error: "Wedding not found" };

  const plan = wedding.planId ? await prisma.plan.findUnique({ where: { id: wedding.planId } }) : null;
  const canBeLive = Boolean(wedding.paidAt || wedding.comped || plan?.priceKobo === 0);
  const status = action === "suspend" ? "SUSPENDED" : action === "archive" ? "ARCHIVED" : canBeLive ? "ACTIVE" : "DRAFT";

  await prisma.wedding.update({ where: { id: wedding.id }, data: { status } });
  await audit(admin.id, `wedding.${action}`, { weddingId: wedding.id, meta: { from: wedding.status, to: status } });
  revalidateWedding(wedding);
  revalidatePath("/super/weddings");
  return { message: `Wedding is now ${status.toLowerCase()}` };
}

/** Grants a plan without payment, or removes the grant (falling back to what they paid for). */
export async function compWedding(weddingId: string, planKey: string | null): Promise<SuperActionResult> {
  const admin = await requirePermission("wedding.comp");
  const wedding = await findWedding(weddingId);
  if (!wedding) return { error: "Wedding not found" };

  if (planKey) {
    const plan = await prisma.plan.findUnique({ where: { key: planKey } });
    if (!plan) return { error: "Plan not found" };
    await prisma.wedding.update({
      where: { id: wedding.id },
      data: { planId: plan.id, comped: true, paidAt: wedding.paidAt ?? new Date() },
    });
    await audit(admin.id, "wedding.comp", { weddingId: wedding.id, meta: { plan: plan.key } });
  } else {
    // Back to the best plan they actually paid for, or else the free plan.
    const paid = await prisma.payment.findFirst({
      where: { weddingId: wedding.id, status: "SUCCESS" },
      include: { plan: true },
      orderBy: { plan: { priceKobo: "desc" } },
    });
    const starter = paid ? null : await getStarterPlan();
    await prisma.wedding.update({
      where: { id: wedding.id },
      data: {
        comped: false,
        planId: paid?.planId ?? starter?.id ?? null,
        paidAt: paid ? (paid.paidAt ?? wedding.paidAt) : null,
        // A wedding with neither a payment nor a free plan can't stay live.
        ...(!paid && !starter && wedding.status === "ACTIVE" ? { status: "DRAFT" as const } : {}),
      },
    });
    await audit(admin.id, "wedding.uncomp", { weddingId: wedding.id, meta: { fallbackPlan: paid?.plan.key ?? null } });
  }

  revalidateWedding(wedding);
  revalidatePath("/super/weddings");
  return { message: planKey ? "Plan granted" : "Complimentary plan removed" };
}

/** "https://www.Amara.com/" → "amara.com"; null if it isn't a plain domain name. */
function normalizeDomain(input: string) {
  const host = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  return /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host) ? host : null;
}

/**
 * Connects a domain the couple owns to their guest site, or disconnects it.
 * Staff do this by hand (Forever plans, or as an exception); DNS is set up
 * separately with the host.
 */
export async function setCustomDomain(weddingId: string, _prev: SuperActionResult | undefined, formData: FormData): Promise<SuperActionResult> {
  const admin = await requirePermission("wedding.manage");
  const wedding = await findWedding(weddingId);
  if (!wedding) return { error: "Wedding not found" };

  const raw = String(formData.get("domain") ?? "");
  const domain = raw.trim() ? normalizeDomain(raw) : null;
  if (raw.trim() && !domain) return { error: "Enter a domain like amaraanddavid.com" };
  const ownHost = process.env.SITE_URL ? new URL(process.env.SITE_URL).hostname.replace(/^www\./, "") : null;
  if (domain && domain === ownHost) return { error: "That's Vowly's own domain" };
  if (domain) {
    const taken = await prisma.wedding.findUnique({ where: { customDomain: domain }, select: { id: true } });
    if (taken && taken.id !== wedding.id) return { error: "Another wedding already uses that domain" };
  }

  await prisma.wedding.update({ where: { id: wedding.id }, data: { customDomain: domain } });
  await audit(admin.id, domain ? "wedding.domain.set" : "wedding.domain.clear", {
    weddingId: wedding.id,
    meta: { from: wedding.customDomain, to: domain },
  });
  revalidatePath(`/super/weddings/${wedding.id}`);
  return { message: domain ? `Connected ${domain}. Point its DNS at Vowly to finish.` : "Domain disconnected" };
}

// ─── Users & impersonation ───────────────────────────────────────────────────

const ASSIGNABLE_ROLES: readonly Role[] = ["USER", ...STAFF_ROLES];

/** Changes someone's staff access. "USER" removes staff access entirely. */
export async function setStaffRole(userId: string, role: Role): Promise<SuperActionResult> {
  const admin = await requirePermission("staff.manage");
  if (!ASSIGNABLE_ROLES.includes(role)) return { error: "Unknown role" };
  if (userId === admin.id) return { error: "You can't change your own role" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };
  await prisma.user.update({ where: { id: user.id }, data: { role } });
  await audit(admin.id, "staff.role", { meta: { userId: user.id, email: user.email, from: user.role, to: role } });
  revalidatePath("/super/staff");
  revalidatePath("/super/users");
  if (role === "USER") return { message: `${user.email} no longer has staff access` };
  // Anyone still on a temporary password gets it with their welcome email instead.
  const sent = role !== user.role && user.passwordHash && !user.mustChangePassword
    ? await sendMail({ to: user.email, ...staffAccessEmail({ role: ROLE_LABELS[role] }) })
    : false;
  return { message: `${user.email} is now ${ROLE_LABELS[role]}${sent ? ". We've emailed them." : ""}` };
}

/** `tempPassword` is only returned when the welcome email couldn't be sent, so the admin can pass it on. */
export type AddStaffState = { error?: string; message?: string; tempPassword?: string } | undefined;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Gives someone staff access, inviting them by email if they're new. */
export async function addStaff(_prevState: AddStaffState, formData: FormData): Promise<AddStaffState> {
  const admin = await requirePermission("staff.manage");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "") as Role;
  if (!EMAIL_REGEX.test(email)) return { error: "Enter a valid email" };
  if (!isStaff(role)) return { error: "Choose an access level" };
  if (!(await takeRateLimit("staff:add", admin.id, 30, 24 * 60 * 60 * 1000))) {
    return { error: "Too many invites today" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.id === admin.id) return { error: "You can't change your own role" };
  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: { role } })
    : await prisma.user.create({ data: { email, role } });
  await audit(admin.id, "staff.add", { meta: { userId: user.id, email, role } });
  revalidatePath("/super/staff");

  // Someone with their own password keeps it; they're just told about the new access.
  if (existing?.passwordHash && !existing.mustChangePassword) {
    if (existing.role === role) return { message: `${email} already has ${ROLE_LABELS[role]} access.` };
    const sent = await sendMail({ to: email, ...staffAccessEmail({ role: ROLE_LABELS[role] }) });
    return { message: `${email} is now ${ROLE_LABELS[role]}.${sent ? " We've emailed them." : ""}` };
  }

  return sendStaffTempPassword(user.id, email, role);
}

/** Issues a temporary password and emails it; when email can't be sent, hands it to the admin once. */
async function sendStaffTempPassword(userId: string, email: string, role: Role): Promise<AddStaffState> {
  const { tempPassword, expiresAt } = await issueTempPassword(userId);
  const sent = await sendMail({ to: email, ...staffWelcomeEmail({ role: ROLE_LABELS[role], email, tempPassword, expiresAt }) });
  return sent
    ? { message: `Added ${email} as ${ROLE_LABELS[role]}. We've emailed them a temporary password; they'll choose their own when they first sign in.` }
    : {
        message: `Added ${email} as ${ROLE_LABELS[role]}, but the email couldn't be sent. Give them this temporary password yourself (it's shown only once):`,
        tempPassword,
      };
}

/** For staff who haven't replaced their temporary password yet (or whose one expired). */
export async function resendStaffPassword(userId: string): Promise<AddStaffState> {
  const admin = await requirePermission("staff.manage");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !isStaff(user.role)) return { error: "Staff member not found" };
  if (user.id === admin.id) return { error: "Use “Forgot password” for your own account" };
  if (user.passwordHash && !user.mustChangePassword) return { error: "They've already set their own password" };
  await audit(admin.id, "staff.temp_password", { meta: { userId: user.id, email: user.email } });
  revalidatePath("/super/staff");
  return sendStaffTempPassword(user.id, user.email, user.role);
}

export async function sendUserPasswordReset(userId: string): Promise<SuperActionResult> {
  const admin = await requirePermission("user.reset");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  const token = await createUserToken(user.id, "RESET");
  await sendMail({ to: user.email, ...passwordResetEmail({ token }) });
  await audit(admin.id, "user.reset_sent", { meta: { userId: user.id, email: user.email } });
  return { message: `Reset link sent to ${user.email}` };
}

/** Signs in as a couple to see what they see. Staff can't be impersonated. */
export async function impersonateUser(userId: string): Promise<SuperActionResult> {
  const admin = await requirePermission("user.impersonate");
  if (admin.impersonatorId) return { error: "Stop impersonating first" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };
  if (isStaff(user.role)) return { error: "Staff accounts can't be impersonated" };

  await audit(admin.id, "user.impersonate", { meta: { userId: user.id, email: user.email } });
  await createSession(user, admin.id);
  redirect("/dashboard");
}

export async function stopImpersonating() {
  const session = await decrypt(await getSessionCookie());
  const user = await getCurrentUser();
  if (!session?.impersonatorId || !user) redirect("/login");

  const admin = await prisma.user.findUnique({ where: { id: session.impersonatorId } });
  if (!admin || !can(admin.role, "user.impersonate")) redirect("/login");

  await audit(admin.id, "user.impersonate_end", { meta: { userId: user.id, email: user.email } });
  await createSession(admin);
  redirect("/super/users");
}

// ─── Payments ────────────────────────────────────────────────────────────────

/** Asks Paystack about a payment again, e.g. when a webhook was missed. */
export async function reverifyPayment(reference: string): Promise<SuperActionResult> {
  const admin = await requirePermission("payment.reverify");
  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) return { error: "Payment not found" };

  let reported;
  try {
    reported = await verifyTransaction(reference);
  } catch (err) {
    console.error("[super] reverify: Paystack request failed", err);
    return { error: "Paystack couldn't be reached or doesn't know this reference. Try again shortly." };
  }

  let result;
  try {
    result = await fulfillPayment(reference, reported, "callback");
  } catch (err) {
    // Paystack answered, but applying it failed on our side (e.g. the database timed out).
    console.error("[super] reverify: applying the payment failed", err);
    await audit(admin.id, "payment.reverify", { weddingId: payment.weddingId, meta: { reference, outcome: "error", paystackStatus: reported.status ?? null } });
    return {
      error: `Paystack says "${reported.status ?? "unknown"}", but saving it failed. Try again, or mark it paid by hand if the money arrived.`,
    };
  }
  await audit(admin.id, "payment.reverify", { weddingId: payment.weddingId, meta: { reference, outcome: result.outcome } });
  if ("wedding" in result) revalidateWedding(result.wedding);
  revalidatePath("/super/payments");
  const messages: Record<typeof result.outcome, SuperActionResult> = {
    fulfilled: { message: "Paid. The wedding now has its plan." },
    already: { message: "Already recorded as paid." },
    failed: { error: "Paystack says this charge failed." },
    mismatch: { error: "Paystack's amount or currency doesn't match this payment. Check it before marking it paid." },
    unknown: { error: `Paystack says "${reported.status ?? "unknown"}": the payment isn't finished yet.` },
  };
  return messages[result.outcome];
}

export type ResolvePaymentState = SuperActionResult | undefined;

/**
 * Marks a pending or failed payment as paid by hand, when staff have proof the
 * money arrived (e.g. Paystack's success email) but it couldn't be applied
 * automatically. Requires a note; gives the wedding its plan exactly as a
 * verified payment would.
 */
export async function markPaymentPaid(reference: string, _prev: ResolvePaymentState, formData: FormData): Promise<ResolvePaymentState> {
  const admin = await requirePermission("payment.resolve");
  const note = String(formData.get("note") ?? "").trim();
  if (note.length < 10) return { error: "Say how you know it was paid (at least 10 characters), e.g. the Paystack email and its date." };
  if (note.length > 500) return { error: "Keep the note under 500 characters." };
  // The day the money arrived (from the Paystack email); defaults to now.
  const paidOn = String(formData.get("paidOn") ?? "");
  const now = new Date();
  if (paidOn && (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn) || Number.isNaN(Date.parse(paidOn)) || paidOn > now.toISOString().slice(0, 10))) {
    return { error: "Choose the date it was paid (not in the future)." };
  }
  const paidAt = paidOn ? new Date(Math.min(Date.parse(`${paidOn}T12:00:00Z`), now.getTime())) : now;

  const result = await resolvePaymentManually(reference, { staffId: admin.id, note, paidAt });
  if (!("wedding" in result)) return { error: "Payment not found" };
  await audit(admin.id, "payment.manual", { weddingId: result.wedding.id, meta: { reference, note, outcome: result.outcome } });
  revalidateWedding(result.wedding);
  revalidatePath("/super/payments");
  return { message: result.outcome === "fulfilled" ? "Marked as paid. The wedding now has its plan." : "Already recorded as paid." };
}

// ─── Plans ───────────────────────────────────────────────────────────────────

export type PlanFormState = { error?: string; success?: boolean } | undefined;

const PLAN_KEY = /^[a-z0-9-]{2,30}$/;

export async function savePlan(_prevState: PlanFormState, formData: FormData): Promise<PlanFormState> {
  const admin = await requirePermission("plans.manage");

  const id = formData.get("id");
  const key = String(formData.get("key") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const priceNaira = Number(formData.get("priceNaira"));
  const maxGuests = Number(formData.get("maxGuests"));
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const tagline = String(formData.get("tagline") ?? "").trim();
  // Empty means "no limit" (uploads) or "permanent" (availability).
  const optionalWhole = (name: string) => {
    const raw = String(formData.get(name) ?? "").trim();
    return raw === "" ? null : Number(raw);
  };
  const maxUploads = optionalWhole("maxUploads");
  const availabilityMonths = optionalWhole("availabilityMonths");
  const lines = (name: string) =>
    String(formData.get(name) ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  const highlights = lines("highlights");
  const limitations = lines("limitations");
  const themes = formData.getAll("themes").filter((t): t is string => typeof t === "string" && THEME_PRESETS.some((p) => p.key === t));

  if (!PLAN_KEY.test(key)) return { error: "Key: 2–30 lowercase letters, numbers or dashes" };
  if (!name || name.length > 40) return { error: "Name is required (max 40 characters)" };
  if (!Number.isFinite(priceNaira) || priceNaira < 0) return { error: "Enter a valid price" };
  if (!Number.isInteger(maxGuests) || maxGuests < 1) return { error: "Guest limit must be a whole number" };
  if (!Number.isInteger(sortOrder)) return { error: "Order must be a whole number" };
  if (tagline.length > 120) return { error: "Tagline is too long (max 120 characters)" };
  if (maxUploads !== null && (!Number.isInteger(maxUploads) || maxUploads < 0)) return { error: "Upload limit must be a whole number" };
  if (availabilityMonths !== null && (!Number.isInteger(availabilityMonths) || availabilityMonths < 1)) {
    return { error: "Months online must be a whole number, or empty for permanent" };
  }
  if (highlights.length > 20 || limitations.length > 20 || [...highlights, ...limitations].some((l) => l.length > 120)) {
    return { error: "Keep each list to 20 lines of up to 120 characters" };
  }

  const features = Object.fromEntries(
    (Object.keys(FEATURE_LABELS) as PlanFeature[]).map((f) => [f, formData.get(`feature_${f}`) === "on"])
  );
  const data = {
    key,
    name,
    priceKobo: Math.round(priceNaira * 100),
    maxGuests,
    sortOrder,
    features,
    active: formData.get("active") === "on",
    popular: formData.get("popular") === "on",
    tagline: tagline || null,
    maxUploads,
    availabilityMonths,
    themes,
    highlights,
    limitations,
  };

  const clash = await prisma.plan.findUnique({ where: { key } });
  if (clash && clash.id !== id) return { error: "Another plan already uses that key" };

  if (typeof id === "string" && id) {
    await prisma.plan.update({ where: { id }, data });
  } else {
    await prisma.plan.create({ data });
  }
  await audit(admin.id, "plan.save", { meta: { key, priceKobo: data.priceKobo, active: data.active } });
  revalidatePath("/super/plans");
  // The landing and pricing pages list the plans.
  revalidatePath("/");
  revalidatePath("/pricing");
  return { success: true };
}

// ─── Support notes ───────────────────────────────────────────────────────────

export type NoteState = { error?: string; success?: boolean } | undefined;

const MAX_NOTE_LENGTH = 2000;

export async function addSupportNote(weddingId: string, _prevState: NoteState, formData: FormData): Promise<NoteState> {
  const staff = await requirePermission("notes.write");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a note first" };
  if (body.length > MAX_NOTE_LENGTH) return { error: `Keep notes under ${MAX_NOTE_LENGTH} characters` };
  const wedding = await findWedding(weddingId);
  if (!wedding) return { error: "Wedding not found" };

  await prisma.supportNote.create({ data: { weddingId: wedding.id, authorId: staff.id, body } });
  revalidatePath(`/super/weddings/${wedding.id}`);
  return { success: true };
}
