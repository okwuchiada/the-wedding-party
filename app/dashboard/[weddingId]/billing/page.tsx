import Link from "next/link";
import { requireWeddingAccess } from "@/lib/dal";
import { formatMoney } from "@/lib/money";
import { fulfillPayment } from "@/lib/payments";
import { PAYSTACK_CURRENCY, verifyTransaction } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { dashboardPath } from "@/lib/tenant";

const MESSAGES = {
  success: { title: "Payment received", body: "Your plan is active. You can publish your site from Settings." },
  pending: { title: "Payment processing", body: "We haven't had confirmation from Paystack yet. This page will update once it arrives — you can safely leave it." },
  failed: { title: "Payment didn't go through", body: "You haven't been charged. You can try again from the Billing tab." },
  review: { title: "We're checking your payment", body: "Something about this payment needs a manual check. We'll be in touch; you don't need to pay again." },
  unknown: { title: "Payment not found", body: "We couldn't find that payment for this wedding." },
} as const;

/** Paystack redirects here after checkout with ?reference=… */
export default async function BillingReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ weddingId: string }>;
  searchParams: Promise<{ reference?: string }>;
}) {
  const { weddingId } = await params;
  const { reference } = await searchParams;
  const { wedding } = await requireWeddingAccess(weddingId, "OWNER");

  const payment = typeof reference === "string"
    ? await prisma.payment.findFirst({ where: { reference, weddingId: wedding.id }, include: { plan: true } })
    : null;

  let status: keyof typeof MESSAGES = "unknown";
  if (payment?.status === "SUCCESS") status = "success";
  else if (payment) {
    // Don't wait for the webhook: ask Paystack directly.
    try {
      const result = await fulfillPayment(payment.reference, await verifyTransaction(payment.reference), "callback");
      status = { fulfilled: "success", already: "success", failed: "failed", mismatch: "review", unknown: "pending" }[
        result.outcome
      ] as keyof typeof MESSAGES;
    } catch (err) {
      console.error("[billing] verify failed", err);
      status = "pending";
    }
  }

  const message = MESSAGES[status];
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <div className="w-full max-w-md bg-white p-8 shadow-[0_18px_40px_-20px_rgb(var(--ink)/0.45)]">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-olive">Billing</p>
        <h1 className="font-(family-name:--serif) text-3xl text-foreground">{message.title}</h1>
        {payment && (
          <p className="mt-2 text-sm text-foreground/60">
            {payment.plan.name} · {formatMoney(payment.amountKobo, { currency: PAYSTACK_CURRENCY, locale: "en-NG" })}
          </p>
        )}
        <p className="mt-4 text-sm text-foreground/80">{message.body}</p>
        <Link
          href={dashboardPath(wedding.id)}
          className="mt-6 inline-block bg-burnt-orange px-5 py-2.5 text-xs font-medium text-ivory hover:bg-burnt-orange-dark"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
