import { describe, expect, it } from "vitest";
import { guestShareUrl } from "@/lib/share-url";

describe("guestShareUrl", () => {
  it("joins the site address and the wedding's path", () => {
    expect(guestShareUrl({ slug: "amara-and-david", customDomain: null }, "https://vowly.ng")).toBe("https://vowly.ng/w/amara-and-david");
  });
  it("doesn't double the slash when the site address ends with one", () => {
    expect(guestShareUrl({ slug: "amara-and-david", customDomain: null }, "https://vowly.ng/")).toBe("https://vowly.ng/w/amara-and-david");
  });
  it("uses the wedding's own domain when it has one", () => {
    expect(guestShareUrl({ slug: "amara-and-david", customDomain: "amaraanddavid.com" }, "https://vowly.ng")).toBe("https://amaraanddavid.com");
  });
  it("needs a site address otherwise", () => {
    expect(guestShareUrl({ slug: "amara-and-david", customDomain: null }, undefined)).toBeNull();
  });
});
