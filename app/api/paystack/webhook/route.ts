import { fulfillPayment } from "@/lib/payments";
import { verifyPaystackSignature } from "@/lib/paystack";
import { revalidateWedding } from "@/lib/tenant";

// Paystack posts events here; configure this URL in the Paystack dashboard.
export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyPaystackSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: { event?: string; data?: { reference?: unknown } & Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (event.event === "charge.success" && typeof event.data?.reference === "string") {
    const result = await fulfillPayment(event.data.reference, event.data, "webhook");
    if (result.outcome === "fulfilled") revalidateWedding(result.wedding);
  }

  // Acknowledge everything else so Paystack doesn't retry events we don't use.
  return Response.json({ received: true });
}
