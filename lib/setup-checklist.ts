import type { TabId } from "@/lib/dashboard-tabs";

type Input = {
  hasStory: boolean;
  hasBankDetails: boolean;
  registryCount: number;
  hasHeroPhoto: boolean;
  status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  /** Only owners can publish, so editors don't get that step. Defaults to true. */
  isOwner?: boolean;
};

/** What a couple still has to do before guests see a complete site, in the order to do it. */
export function setupSteps(input: Input) {
  const steps = [
    { id: "details", label: "Names, date and look", done: true, tab: "story" },
    { id: "story", label: "Tell your story", done: input.hasStory, tab: "story" },
    { id: "photo", label: "Add a cover photo", done: input.hasHeroPhoto, tab: "story" },
    { id: "bank", label: "Add bank details for gifts", done: input.hasBankDetails, tab: "registry" },
    { id: "registry", label: "Add a gift to your registry", done: input.registryCount > 0, tab: "registry" },
    { id: "publish", label: "Publish your site", done: input.status === "ACTIVE", tab: "settings" },
  ] as const satisfies readonly { id: string; label: string; done: boolean; tab: TabId }[];
  return input.isOwner === false ? steps.filter((s) => s.id !== "publish") : steps;
}
