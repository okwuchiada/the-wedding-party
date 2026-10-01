export const DASHBOARD_TABS = [
  { id: "registry", label: "Registry" },
  { id: "contributions", label: "Contributions" },
  { id: "media", label: "Photos" },
  { id: "wishes", label: "Wishes" },
  { id: "rsvps", label: "RSVPs" },
  { id: "story", label: "Our story" },
  { id: "design", label: "Design" },
  { id: "wording", label: "Wording" },
  // Editors see Settings too, but only its People section.
  { id: "settings", label: "Settings" },
  { id: "billing", label: "Billing", ownerOnly: true },
] as const satisfies readonly { id: string; label: string; ownerOnly?: boolean }[];

export type TabId = (typeof DASHBOARD_TABS)[number]["id"];

// Older links to tabs that moved.
const MOVED: Record<string, TabId> = { people: "settings" };

export function tabFromParam(param: string | string[] | undefined, isOwner: boolean): TabId {
  const id = typeof param === "string" ? (MOVED[param] ?? param) : param;
  const tab = DASHBOARD_TABS.find((t) => t.id === id);
  if (!tab || ("ownerOnly" in tab && tab.ownerOnly && !isOwner)) return DASHBOARD_TABS[0].id;
  return tab.id;
}

export function dashboardTabHref(weddingId: string, tab: TabId) {
  return `/dashboard/${weddingId}?tab=${tab}`;
}
