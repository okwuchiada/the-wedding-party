import { describe, expect, it } from "vitest";
import { isSupportStatus, MAX_MESSAGE_LENGTH, MAX_SUBJECT_LENGTH, readMessage, readNewRequest, topicLabel } from "@/lib/support";

describe("readNewRequest", () => {
  const valid = { topic: "billing", subject: "  Charged twice  ", body: " I paid for Premium twice. " };

  it("trims and accepts a complete request", () => {
    expect(readNewRequest(valid)).toEqual({ topic: "billing", subject: "Charged twice", body: "I paid for Premium twice." });
  });

  it("rejects an unknown topic", () => {
    expect(readNewRequest({ ...valid, topic: "hacking" })).toEqual({ error: "Choose what it's about" });
  });

  it("needs a subject within the limit", () => {
    expect(readNewRequest({ ...valid, subject: "   " })).toEqual({ error: "Add a short subject" });
    expect(readNewRequest({ ...valid, subject: "x".repeat(MAX_SUBJECT_LENGTH + 1) })).toHaveProperty("error");
  });

  it("needs a message within the limit", () => {
    expect(readNewRequest({ ...valid, body: "" })).toEqual({ error: "Write a message first" });
    expect(readNewRequest({ ...valid, body: "x".repeat(MAX_MESSAGE_LENGTH + 1) })).toHaveProperty("error");
  });
});

describe("support helpers", () => {
  it("reads a reply", () => {
    expect(readMessage(null)).toEqual({ error: "Write a message first" });
    expect(readMessage(" Thanks! ")).toEqual({ body: "Thanks!" });
  });

  it("knows the statuses and topic labels", () => {
    expect(isSupportStatus("IN_PROGRESS")).toBe(true);
    expect(isSupportStatus("CLOSED")).toBe(false);
    expect(topicLabel("site")).toBe("My wedding site");
    expect(topicLabel("unknown")).toBe("Something else");
  });
});
