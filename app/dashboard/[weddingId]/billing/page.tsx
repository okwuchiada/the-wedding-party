import Link from "next/link";
import { WovenBand } from "@/components/marketing/shell";
import { requireWeddingAccess } from "@/lib/dal";
import { formatMoney } from "@/lib/money";
import { fulfillPayment } from "@/lib/payments";
import { PAYSTACK_CURRENCY, verifyTransaction } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { dashboardTabHref } from "@/lib/dashboard-tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const MESSAGES = {
  success: { title: "Payment received", body: "Your plan is active. You can publish your site from Settings." },
  pending: { title: "Payment processing", body: "We haven't had confirmation from Paystack yet. This page will update once it arrives — you can safely leave it." },
  failed: { title: "Payment didn't go through", body: "You haven't been charged. You can try again from Billing." },
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
  const { wedding } = await requireWeddingAccess(weddingId, "owner");

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
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <Card className="w-full max-w-md gap-0 overflow-hidden rounded-md py-0 shadow-[0_30px_60px_-40px_rgb(22_32_74/0.45)]">
        <WovenBand className="h-2" />
        <div className="p-8">
          <h1 className="font-(family-name:--m-display) text-3xl font-extrabold tracking-[-0.02em]">{message.title}</h1>
          {payment && (
            <p className="mt-2 text-sm text-ink/60">
              {payment.plan.name}, {formatMoney(payment.amountKobo, { currency: PAYSTACK_CURRENCY, locale: "en-NG" })}
            </p>
          )}
          <p className="mt-4 leading-relaxed text-ink/80">{message.body}</p>
          <Button asChild size="lg" className="mt-7 py-3">
            <Link href={dashboardTabHref(wedding.id, "billing")}>Back to billing</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
