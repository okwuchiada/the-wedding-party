import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { paymentMatches } from "@/lib/billing";
import { PAYSTACK_CURRENCY } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";

export type FulfillResult =
  | { outcome: "fulfilled" | "already"; wedding: { id: string; slug: string } }
  | { outcome: "unknown" | "failed" | "mismatch" };

type Reported = { status?: unknown; reference?: unknown; amount?: unknown; currency?: unknown; paid_at?: unknown };

/**
 * Applies a charge Paystack reports as successful. Safe to call repeatedly and
 * concurrently (webhook and callback both do): only the call that marks the
 * payment SUCCESS applies it.
 */
export async function fulfillPayment(reference: string, reported: Reported, source: "webhook" | "callback"): Promise<FulfillResult> {
  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: { plan: true, wedding: { select: { id: true, slug: true } } },
  });
  if (!payment) return { outcome: "unknown" };
  if (payment.status === "SUCCESS") return { outcome: "already", wedding: payment.wedding };

  const payload = JSON.parse(JSON.stringify(reported)) as Prisma.InputJsonValue;
  const expected = { reference, amountKobo: payment.amountKobo, currency: PAYSTACK_CURRENCY };

  if (!paymentMatches(expected, reported)) {
    // "abandoned" only means checkout isn't finished yet; the guest may still pay.
    if (reported.status === "failed") {
      await prisma.payment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: { status: "FAILED", paystackPayload: payload },
      });
      return { outcome: "failed" };
    }
    // A "success" for the wrong amount or currency needs a human; leave it pending.
    if (reported.status === "success") {
      await prisma.auditLog.create({
        data: { weddingId: payment.weddingId, action: "payment.mismatch", meta: { reference, source, reported: payload } },
      });
      return { outcome: "mismatch" };
    }
    return { outcome: "unknown" };
  }

  const paidAt = typeof reported.paid_at === "string" && !Number.isNaN(Date.parse(reported.paid_at))
    ? new Date(reported.paid_at)
    : new Date();

  const applied = await applySuccessfulPayment(payment, paidAt, payload, { reference, amountKobo: payment.amountKobo, plan: payment.plan.key, source });

  return { outcome: applied ? "fulfilled" : "already", wedding: payment.wedding };
}

type PaymentWithPlan = { id: string; weddingId: string; planId: string; plan: { priceKobo: number; maxGuests: number } };

/**
 * Marks a payment SUCCESS and gives the wedding what it paid for, once. Only the
 * call that flips the payment applies it, so repeats (webhook + callback, or a
 * manual resolution racing Paystack) are harmless.
 */
async function applySuccessfulPayment(
  payment: PaymentWithPlan,
  paidAt: Date,
  payload: Prisma.InputJsonValue,
  auditMeta: Prisma.InputJsonValue
) {
  return prisma.$transaction(async (tx) => {
    // FAILED is included: if Paystack later confirms the charge, the money was taken.
    const { count } = await tx.payment.updateMany({
      where: { id: payment.id, status: { in: ["PENDING", "FAILED"] } },
      data: { status: "SUCCESS", paidAt, paystackPayload: payload },
    });
    if (count === 0) return false;

    const wedding = await tx.wedding.findUniqueOrThrow({ where: { id: payment.weddingId }, include: { plan: true } });
    // Never move a wedding down a tier if an older payment lands late.
    const upgrade = !wedding.plan || payment.plan.priceKobo > wedding.plan.priceKobo;
    // Raise the guest cap with the plan unless the couple chose their own limit.
    const oldCap = wedding.plan?.maxGuests ?? 100;
    await tx.wedding.update({
      where: { id: wedding.id },
      data: {
        paidAt: wedding.paidAt ?? paidAt,
        ...(upgrade ? { planId: payment.planId } : {}),
        ...(upgrade && wedding.maxGuests === oldCap ? { maxGuests: payment.plan.maxGuests } : {}),
      },
    });
    await tx.auditLog.create({ data: { weddingId: wedding.id, action: "payment.succeeded", meta: auditMeta } });
    return true;
  });
}

export type ManualResolution = { staffId: string; note: string; paidAt: Date };

/**
 * For a charge Paystack took but we never recorded (e.g. the webhook and the
 * re-check both failed): staff mark it paid by hand, with a note saying how they
 * know. Applies exactly what a verified payment would, and says it was manual.
 */
export async function resolvePaymentManually(reference: string, resolution: ManualResolution): Promise<FulfillResult> {
  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: { plan: true, wedding: { select: { id: true, slug: true } } },
  });
  if (!payment) return { outcome: "unknown" };
  if (payment.status === "SUCCESS") return { outcome: "already", wedding: payment.wedding };

  const payload = {
    manual: true,
    resolvedBy: resolution.staffId,
    note: resolution.note,
    previousStatus: payment.status,
    previousPayload: payment.paystackPayload ?? null,
  } as Prisma.InputJsonValue;
  const applied = await applySuccessfulPayment(payment, resolution.paidAt, payload, {
    reference,
    amountKobo: payment.amountKobo,
    plan: payment.plan.key,
    source: "manual",
    actorId: resolution.staffId,
    note: resolution.note,
  });
  return { outcome: applied ? "fulfilled" : "already", wedding: payment.wedding };
}
