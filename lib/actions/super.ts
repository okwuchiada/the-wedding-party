"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { getCurrentUser, requirePermission } from "@/lib/dal";
import { sendInvite } from "@/lib/invites";
import { can, isStaff, ROLE_LABELS, STAFF_ROLES, type Role } from "@/lib/permissions";
import { decrypt, getSessionCookie, createSession } from "@/lib/session";
import { passwordResetEmail, sendMail } from "@/lib/mail";
import { fulfillPayment } from "@/lib/payments";
import { verifyTransaction } from "@/lib/paystack";
import { FEATURE_LABELS, type PlanFeature } from "@/lib/plans";
import { takeRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
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

  const status =
    action === "suspend" ? "SUSPENDED" : action === "archive" ? "ARCHIVED" : wedding.paidAt || wedding.comped ? "ACTIVE" : "DRAFT";

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
    // Back to the best plan they actually paid for, if any.
    const paid = await prisma.payment.findFirst({
      where: { weddingId: wedding.id, status: "SUCCESS" },
      include: { plan: true },
      orderBy: { plan: { priceKobo: "desc" } },
    });
    await prisma.wedding.update({
      where: { id: wedding.id },
      data: {
        comped: false,
        planId: paid?.planId ?? null,
        paidAt: paid ? (paid.paidAt ?? wedding.paidAt) : null,
        // An unpaid wedding can't stay live.
        ...(!paid && wedding.status === "ACTIVE" ? { status: "DRAFT" as const } : {}),
      },
    });
    await audit(admin.id, "wedding.uncomp", { weddingId: wedding.id, meta: { fallbackPlan: paid?.plan.key ?? null } });
  }

  revalidateWedding(wedding);
  revalidatePath("/super/weddings");
  return { message: planKey ? "Plan granted" : "Complimentary plan removed" };
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
  return { message: role === "USER" ? `${user.email} no longer has staff access` : `${user.email} is now ${ROLE_LABELS[role]}` };
}

export type AddStaffState = { error?: string; message?: string } | undefined;

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

  let message = `${email} is now ${ROLE_LABELS[role]}.`;
  if (!user.passwordHash) {
    await sendInvite(user, null);
    message = `Invite sent to ${email} as ${ROLE_LABELS[role]}.`;
  }
  revalidatePath("/super/staff");
  return { message };
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

  let result;
  try {
    result = await fulfillPayment(reference, await verifyTransaction(reference), "callback");
  } catch (err) {
    console.error("[super] reverify failed", err);
    return { error: "Paystack couldn't be reached or doesn't know this reference" };
  }
  await audit(admin.id, "payment.reverify", { weddingId: payment.weddingId, meta: { reference, outcome: result.outcome } });
  if ("wedding" in result) revalidateWedding(result.wedding);
  revalidatePath("/super/payments");
  return { message: `Paystack says: ${result.outcome}` };
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

  if (!PLAN_KEY.test(key)) return { error: "Key: 2–30 lowercase letters, numbers or dashes" };
  if (!name || name.length > 40) return { error: "Name is required (max 40 characters)" };
  if (!Number.isFinite(priceNaira) || priceNaira < 0) return { error: "Enter a valid price" };
  if (!Number.isInteger(maxGuests) || maxGuests < 1) return { error: "Guest limit must be a whole number" };
  if (!Number.isInteger(sortOrder)) return { error: "Order must be a whole number" };

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
