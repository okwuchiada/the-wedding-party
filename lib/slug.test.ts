import { describe, expect, it } from "vitest";
import { slugError, slugify, suggestWeddingSlug } from "@/lib/slug";

describe("slugs", () => {
  it("slugifies names, accents and ampersands", () => {
    expect(slugify("  Zoë & Chídí!! ")).toBe("zoe-and-chidi");
  });

  it("suggests a slug from first names", () => {
    expect(suggestWeddingSlug("Adanma Okwuchi", "Tobi Ade")).toBe("adanma-and-tobi");
  });

  it("validates slugs", () => {
    expect(slugError("ada-and-tobi")).toBeNull();
    expect(slugError("ab")).not.toBeNull();
    expect(slugError("Ada-Tobi")).not.toBeNull();
    expect(slugError("ada--tobi")).not.toBeNull();
    expect(slugError("-ada")).not.toBeNull();
  });
});
