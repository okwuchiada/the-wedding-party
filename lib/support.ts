import type { SupportRequestStatus } from "@/lib/generated/prisma/client";

/** What a couple can ask about (Dashboard → Support). Staff filter Requests by these. */
export const SUPPORT_TOPICS = [
  { key: "billing", label: "Billing & plans" },
  { key: "payments", label: "Guest payments & contributions" },
  { key: "site", label: "My wedding site" },
  { key: "account", label: "Signing in & my account" },
  { key: "other", label: "Something else" },
] as const;

export type SupportTopic = (typeof SUPPORT_TOPICS)[number]["key"];

export const SUPPORT_STATUSES: SupportRequestStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED"];

export const SUPPORT_STATUS_LABELS: Record<SupportRequestStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

export const MAX_SUBJECT_LENGTH = 120;
export const MAX_MESSAGE_LENGTH = 4000;

export function topicLabel(key: string) {
  return SUPPORT_TOPICS.find((t) => t.key === key)?.label ?? "Something else";
}

export function isSupportStatus(value: unknown): value is SupportRequestStatus {
  return (SUPPORT_STATUSES as unknown[]).includes(value);
}

/** Checks one message in a thread. Returns the trimmed body, or the error to show. */
export function readMessage(raw: unknown): { body: string } | { error: string } {
  const body = String(raw ?? "").trim();
  if (!body) return { error: "Write a message first" };
  if (body.length > MAX_MESSAGE_LENGTH) return { error: `Keep messages under ${MAX_MESSAGE_LENGTH} characters` };
  return { body };
}

/** Checks a new request from the Contact support form. */
export function readNewRequest(fields: { topic: unknown; subject: unknown; body: unknown }):
  | { topic: SupportTopic; subject: string; body: string }
  | { error: string } {
  const topic = SUPPORT_TOPICS.find((t) => t.key === fields.topic)?.key;
  if (!topic) return { error: "Choose what it's about" };
  const subject = String(fields.subject ?? "").trim();
  if (!subject) return { error: "Add a short subject" };
  if (subject.length > MAX_SUBJECT_LENGTH) return { error: `Keep the subject under ${MAX_SUBJECT_LENGTH} characters` };
  const message = readMessage(fields.body);
  if ("error" in message) return message;
  return { topic, subject, body: message.body };
}
