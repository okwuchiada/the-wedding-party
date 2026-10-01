import { describe, expect, it } from "vitest";
import { slugError, slugFromInput, slugify, suggestWeddingSlug } from "@/lib/slug";

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

describe("slugFromInput", () => {
  it("keeps just the address from a pasted link", () => {
    expect(slugFromInput("http://localhost:3000/aisha-and-kareem")).toEqual({ slug: "aisha-and-kareem", fromLink: true });
    expect(slugFromInput("https://vowly.ng/w/aisha-and-kareem/")).toEqual({ slug: "aisha-and-kareem", fromLink: true });
    expect(slugFromInput("vowly.ng/w/aisha-and-kareem?ref=wa#rsvp")).toEqual({ slug: "aisha-and-kareem", fromLink: true });
    expect(slugFromInput("/w/aisha-and-kareem")).toEqual({ slug: "aisha-and-kareem", fromLink: true });
  });
  it("takes the wedding's address, not a page inside it", () => {
    expect(slugFromInput("https://vowly.ng/w/aisha-and-kareem/gallery")).toEqual({ slug: "aisha-and-kareem", fromLink: true });
  });
  it("lowercases what's typed and leaves a plain address alone", () => {
    expect(slugFromInput("Aisha-And-Kareem")).toEqual({ slug: "aisha-and-kareem", fromLink: false });
  });
  it("leaves a link with no address part for the usual error", () => {
    expect(slugFromInput("https://vowly.ng")).toEqual({ slug: "https://vowly.ng", fromLink: false });
  });
});
