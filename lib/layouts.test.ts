import { describe, expect, it } from "vitest";
import { decodeSections, encodeSections, normalizeSections, resolveLayout, visibleSections, withPreview } from "@/lib/layouts";

describe("resolveLayout", () => {
  it("defaults to Classic with its split hero and the default sections", () => {
    const layout = resolveLayout(null);
    expect(layout).toMatchObject({ template: "classic", hero: "split", heroChoice: null });
    expect(visibleSections(layout)).toEqual(["story", "notes", "registry", "gift", "rsvp"]);
  });

  it("uses each template's default hero unless the couple picked one", () => {
    expect(resolveLayout({ layoutTemplate: "minimal" }).hero).toBe("card");
    expect(resolveLayout({ layoutTemplate: "minimal", heroLayout: "cover" }).hero).toBe("cover");
  });

  it("ignores unknown values", () => {
    expect(resolveLayout({ layoutTemplate: "brutalist", heroLayout: "video" })).toMatchObject({ template: "classic", hero: "split" });
  });
});

describe("normalizeSections", () => {
  it("keeps order and visibility, drops junk and duplicates, appends missing sections", () => {
    const out = normalizeSections([
      { id: "rsvp", visible: true },
      { id: "notes", visible: false },
      { id: "rsvp", visible: false },
      { id: "hacker" },
      "nonsense",
    ]);
    expect(out.map((s) => `${s.visible ? "" : "-"}${s.id}`)).toEqual(["rsvp", "-notes", "story", "registry", "gift", "-asoebi"]);
  });
});

describe("previews", () => {
  it("round-trips sections through the URL form", () => {
    const sections = normalizeSections([{ id: "gift", visible: false }, { id: "rsvp", visible: true }]);
    expect(encodeSections(sections)).toBe("-gift,rsvp,story,notes,registry,-asoebi");
    expect(decodeSections(encodeSections(sections))).toEqual(sections);
  });

  it("overrides only what the preview sets", () => {
    const saved = resolveLayout({ layoutTemplate: "editorial", heroLayout: "cover" });
    expect(withPreview(saved, {})).toBe(saved);
    expect(withPreview(saved, { layout: "owambe" })).toMatchObject({ template: "owambe", hero: "cover" });
    expect(withPreview(saved, { hero: "" })).toMatchObject({ template: "editorial", hero: "type", heroChoice: null });
    expect(visibleSections(withPreview(saved, { sections: "rsvp,-story" }))).toEqual(["rsvp", "notes", "registry", "gift"]);
  });
});

describe("hero names", () => {
  it("defaults to full names and ignores unknown styles", async () => {
    expect(resolveLayout(null).heroNames).toBe("full");
    expect(resolveLayout({ heroNames: "nicknames" }).heroNames).toBe("full");
    expect(resolveLayout({ heroNames: "first" }).heroNames).toBe("first");
  });

  it("shortens to the first name only when asked", async () => {
    const { heroName } = await import("@/lib/layouts");
    expect(heroName("Adanma Okwuchi", "first")).toBe("Adanma");
    expect(heroName("  Tobi   Ade ", "first")).toBe("Tobi");
    expect(heroName("Adanma Okwuchi", "full")).toBe("Adanma Okwuchi");
  });

  it("can be previewed", () => {
    expect(withPreview(resolveLayout(null), { names: "first" }).heroNames).toBe("first");
  });
});

describe("couple names", () => {
  it("formats both names in the chosen style", async () => {
    const { coupleNames, coupleTitle } = await import("@/lib/layouts");
    const story = { brideName: "Amara Obi", groomName: "David Mensah" };
    expect(coupleTitle(story, "full")).toBe("Amara Obi & David Mensah");
    expect(coupleTitle(story, "first")).toBe("Amara & David");
    expect(coupleNames(story, "first")).toEqual(["Amara", "David"]);
    expect(coupleTitle(null, "first")).toBeNull();
  });
});
