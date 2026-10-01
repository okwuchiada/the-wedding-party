import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, uploadSizeError } from "./uploads";

describe("uploadSizeError", () => {
  it("accepts sizes up to the limit", () => {
    expect(uploadSizeError(1)).toBeNull();
    expect(uploadSizeError(MAX_UPLOAD_BYTES)).toBeNull();
  });

  it("rejects files over the limit with the label", () => {
    expect(uploadSizeError(MAX_UPLOAD_BYTES + 1, "Image")).toBe("Image is over the 25MB limit");
  });

  it("rejects sizes that can't be signed", () => {
    for (const size of [0, -1, 1.5, Number.NaN, "100", undefined]) {
      expect(uploadSizeError(size)).not.toBeNull();
    }
  });
});
