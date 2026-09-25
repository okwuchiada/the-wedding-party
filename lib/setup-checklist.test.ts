import { describe, expect, it } from "vitest";
import { setupSteps } from "@/lib/setup-checklist";

const fresh = { hasStory: false, hasBankDetails: false, registryCount: 0, hasHeroPhoto: false, status: "DRAFT" as const };

describe("setupSteps", () => {
  it("starts with only the details step done", () => {
    const steps = setupSteps(fresh);
    expect(steps.map((s) => [s.id, s.done])).toEqual([
      ["details", true], ["story", false], ["photo", false], ["bank", false], ["registry", false], ["publish", false],
    ]);
  });
  it("marks publish done once the site is live", () => {
    expect(setupSteps({ ...fresh, status: "ACTIVE" }).find((s) => s.id === "publish")?.done).toBe(true);
  });
  it("points each step at the tab that completes it", () => {
    expect(setupSteps(fresh).find((s) => s.id === "bank")?.tab).toBe("registry");
    expect(setupSteps(fresh).find((s) => s.id === "publish")?.tab).toBe("settings");
  });
});

describe("setupSteps for people who can't publish", () => {
  it("leaves out the publish step for editors", () => {
    const steps = setupSteps({ ...fresh, isOwner: false });
    expect(steps.map((s) => s.id)).not.toContain("publish");
    expect(steps).toHaveLength(5);
  });
  it("keeps it for owners (the default)", () => {
    expect(setupSteps(fresh).map((s) => s.id)).toContain("publish");
  });
});
