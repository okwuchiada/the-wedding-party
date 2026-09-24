import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// PAYSTACK_API_BASE exists so tests can point at a local mock; production uses the default.
const API_BASE = process.env.PAYSTACK_API_BASE || "https://api.paystack.co";
export const PAYSTACK_CURRENCY = "NGN";

export function paystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

/** Paystack signs webhook bodies with HMAC-SHA512 of the raw body, keyed by the secret key. */
export function verifyPaystackSignature(rawBody: string, signature: string | null, key = process.env.PAYSTACK_SECRET_KEY) {
  if (!key || !signature) return false;
  const expected = Buffer.from(createHmac("sha512", key).update(rawBody).digest("hex"));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function newPaymentReference() {
  return `wp_${randomBytes(12).toString("hex")}`;
}

export type PaystackTransaction = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string | null;
  metadata?: unknown;
};

async function paystackRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
  if (!res.ok || !body?.status || !body.data) {
    throw new Error(`Paystack ${path} failed: ${body?.message ?? res.status}`);
  }
  return body.data;
}

export function initializeTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}) {
  return paystackRequest<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: PAYSTACK_CURRENCY,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
}

export function verifyTransaction(reference: string) {
  return paystackRequest<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}
