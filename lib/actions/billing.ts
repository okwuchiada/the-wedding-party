"use server";

import { redirect } from "next/navigation";
import { MIN_CHARGE_KOBO, upgradeCharge } from "@/lib/billing";
import { requireWeddingAccess } from "@/lib/dal";
import { initializeTransaction, newPaymentReference, paystackConfigured } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { takeRateLimit } from "@/lib/rate-limit";

export type CheckoutState = { error?: string } | undefined;

const HOUR = 60 * 60 * 1000;
const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

/** Owners pick a plan; we record the exact charge, then hand off to Paystack. */
export async function startCheckout(
  weddingId: string,
  _prevState: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const { user, wedding, asStaff } = await requireWeddingAccess(weddingId, "owner");
  // Only the couple pays; staff can comp a plan from the console instead.
  if (asStaff) return { error: "Only the couple can pay for a plan. Comp it from the staff console instead." };
  if (!paystackConfigured()) return { error: "Payments aren't available yet. Please try again later." };

  const planKey = formData.get("planKey");
  const plan = typeof planKey === "string" ? await prisma.plan.findUnique({ where: { key: planKey } }) : null;
  if (!plan) return { error: "Choose a plan" };

  const { _sum } = await prisma.payment.aggregate({
    where: { weddingId: wedding.id, status: "SUCCESS" },
    _sum: { amountKobo: true },
  });
  const charge = upgradeCharge(plan, wedding.plan, _sum.amountKobo ?? 0);
  if (charge === null) return { error: "That plan isn't available for this wedding" };
  if (charge < MIN_CHARGE_KOBO) return { error: "Please contact support to change to this plan" };

  if (!(await takeRateLimit("checkout", wedding.id, 10, HOUR))) {
    return { error: "Too many checkout attempts. Please try again in a little while." };
  }

  const reference = newPaymentReference();
  await prisma.payment.create({
    data: { weddingId: wedding.id, planId: plan.id, reference, amountKobo: charge },
  });

  let authorizationUrl: string;
  try {
    const transaction = await initializeTransaction({
      email: user.email,
      amountKobo: charge,
      reference,
      callbackUrl: `${SITE_URL}/dashboard/${wedding.id}/billing`,
      metadata: { weddingId: wedding.id, planKey: plan.key },
    });
    authorizationUrl = transaction.authorization_url;
  } catch (err) {
    console.error("[billing] Paystack initialize failed", err);
    await prisma.payment.update({ where: { reference }, data: { status: "FAILED" } });
    return { error: "We couldn't reach the payment provider. Please try again." };
  }

  redirect(authorizationUrl);
}
