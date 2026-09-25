import { describe, expect, it } from "vitest";
import { reviewMessage } from "./review";

describe("reviewMessage", () => {
  it("names a single item and what happened to it", () => {
    expect(reviewMessage("Wish", 1, "PENDING", "APPROVED")).toBe("Wish approved");
    expect(reviewMessage("Photo", 1, "APPROVED", "HIDDEN")).toBe("Photo hidden");
  });
  it("calls bringing back a hidden item a restore", () => {
    expect(reviewMessage("Wish", 1, "HIDDEN", "APPROVED")).toBe("Wish restored");
  });
  it("counts several items", () => {
    expect(reviewMessage("Photo", 3, "PENDING", "APPROVED")).toBe("3 photos approved");
    expect(reviewMessage("Wish", 2, "PENDING", "HIDDEN")).toBe("2 wishes hidden");
  });
  it("describes a move back to pending", () => {
    expect(reviewMessage("Photo", 1, "APPROVED", "PENDING")).toBe("Photo moved back to pending");
  });
});
