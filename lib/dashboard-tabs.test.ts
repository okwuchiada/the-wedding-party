import { describe, expect, it } from "vitest";
import { DASHBOARD_TABS, dashboardTabHref, tabFromParam } from "@/lib/dashboard-tabs";

describe("tabFromParam", () => {
  it("returns a known tab", () => {
    expect(tabFromParam("rsvps", false)).toBe("rsvps");
  });
  it("falls back to the first tab for unknown values", () => {
    expect(tabFromParam("nope", true)).toBe("registry");
    expect(tabFromParam(undefined, true)).toBe("registry");
    expect(tabFromParam(["rsvps", "media"], true)).toBe("registry");
  });
  it("hides owner-only tabs from editors", () => {
    expect(tabFromParam("billing", false)).toBe("registry");
    expect(tabFromParam("billing", true)).toBe("billing");
  });
});

describe("People inside Settings", () => {
  it("sends old People links to Settings", () => {
    expect(tabFromParam("people", false)).toBe("settings");
    expect(tabFromParam("people", true)).toBe("settings");
  });
  it("lets editors open Settings, where they see People", () => {
    expect(tabFromParam("settings", false)).toBe("settings");
  });
  it("no longer has a People tab of its own", () => {
    expect(DASHBOARD_TABS.map((t) => t.id)).not.toContain("people");
  });
});

describe("dashboardTabHref", () => {
  it("builds the link", () => {
    expect(dashboardTabHref("cm4abc", "billing")).toBe("/dashboard/cm4abc?tab=billing");
  });
});
